// @flow
import type { NextFunction } from "express";
import type {
  HullRequest,
  HullResponse,
  HullBatchHandlersConfiguration
} from "../../types";

const _ = require("lodash");
const debug = require("debug")("hull-connector:batch-handler");

const {
  extractStream,
  trimTraitsPrefixFromUserMessage
} = require("../../utils");

function batchExtractProcessingMiddlewareFactory(
  configuration: HullBatchHandlersConfiguration
) {
  return async function batchExtractProcessingMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { client } = req.hull;
    if (!req.body || typeof req.body !== "object") {
      return next(new Error("Missing body payload"));
    }

    if (client === undefined) {
      return next(new Error("Authorized HullClient is missing"));
    }

    const { body = {} } = req;
    const { url, format, object_type = "user" } = body;
    const entityType = object_type.replace("_report", "");
    const channel = `${entityType}:update`;
    const handlers = _.filter(configuration, { channel });
    if (!handlers.length) {
      return next(new Error(`Missing handler for this channel: ${channel}`));
    }
    try {
      await handlers.map(({ callback, options = {} }) => {
        debug("channel", channel);
        debug("entityType", entityType);
        debug("handlerCallback", typeof callback);
        if (!url || !format) {
          throw new Error(
            "Missing any of required payload parameters: `url`, `format`."
          );
        }
        req.hull.isBatch = true;
        return extractStream({
          body,
          batchSize: options.maxSize || 100,
          onResponse: () => res.end("ok"),
          onError: err => {
            client.logger.error("connector.batch.error", err.stack);
            res.sendStatus(400);
          },
          callback: entities => {
            const segmentId = (req.query && req.query.segment_id) || null;

            const segmentsList = req.hull[`${entityType}sSegments`].map(s =>
              _.pick(s, ["id", "name", "type", "created_at", "updated_at"])
            );
            const entitySegmentsKey =
              entityType === "user" ? "segments" : "account_segments";
            const messages = entities.map(entity => {
              const segmentIds = _.compact(
                _.uniq(_.concat(entity.segment_ids || [], [segmentId]))
              );
              if (entityType === "user") {
                return trimTraitsPrefixFromUserMessage({
                  [entityType]: _.omit(entity, "segment_ids"),
                  [entitySegmentsKey]: _.compact(
                    segmentIds.map(id => _.find(segmentsList, { id }))
                  ),
                  user: _.omit(entity, "account"),
                  account: entity.account || {}
                });
              }
              return {
                [entityType]: _.omit(entity, "segment_ids"),
                [entitySegmentsKey]: _.compact(
                  segmentIds.map(id => _.find(segmentsList, { id }))
                )
              };
            });
            // $FlowFixMe
            return callback(req.hull, messages);
          }
        });
      });
      return next();
    } catch (err) {
      debug("Error in Batch Handler", err);
      return next(err);
    }
  };
}

module.exports = batchExtractProcessingMiddlewareFactory;
