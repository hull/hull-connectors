// @flow
import type { HullContext, HullStatusResponse } from "hull";

const _ = require("lodash");

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

async function statusCheckAction(ctx: HullContext): HullStatusResponse {
  const { connector = {}, segments = [] } = ctx;
  const { private_settings } = connector;
  const {
    access_token,
    tag_mapping,
    send_events = [],
    synchronized_segments = []
  } = private_settings;
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  const messages = [];
  let status = "ok";
  const promises = [];
  const audit = [];

  if (!access_token) {
    messages.push("Missing access token");
    status = "setupRequired";
  }

  if (_.isEmpty(synchronized_segments)) {
    messages.push(
      "No segments will be send out to Intercom because of missing configuration"
    );
    status = "ok";
  }

  if (_.isEmpty(send_events)) {
    messages.push(
      "No events will be sent to Intercom because of missing configuration"
    );
    status = "ok";
  }

  if (access_token) {
    promises.push(
      syncAgent.intercomAgent
        .getUsersTotalCount()
        .then(total => {
          if (!total || total === 0) {
            messages.push("Got zero results from Intercom");
            status = "error";
          }
        })
        .catch(err => {
          if (err && err.statusCode === 401) {
            messages.push("API Credentials are invalid");
          } else {
            messages.push(
              `Error when trying to connect with Intercom: ${_.get(
                err,
                "message",
                "Unknown"
              )}`
            );
          }
          status = "error";
        })
    );
    promises.push(
      syncAgent.intercomAgent.intercomClient.get("/tags").then(({ body }) => {
        const promises2 = [];
        _.forEach(tag_mapping, (tagId, segmentId) => {
          const segment = _.find(segments, { id: segmentId });
          const tag = _.find(body.tags, { id: tagId });
          if (_.isUndefined(tag) && segment !== undefined) {
            messages.push(
              `Not found tag: ${tagId} mapped to segment: ${segmentId} (${segment.name})`
            );
            status = "error";
          }
          if (
            segment !== undefined &&
            _.includes(synchronized_segments, segmentId)
          ) {
            promises2.push(
              syncAgent.intercomAgent.intercomClient
                .get("/users")
                .query({ tag_id: tagId, per_page: 1 })
                .then(result => {
                  return audit.push({
                    segmentId,
                    tagId,
                    name: segment.name,
                    hullCount: segment.stats.users,
                    intercomCount: result.body.pages.total_pages,
                    percentage:
                      segment.stats.users === 0
                        ? 0
                        : (result.body.pages.total_pages /
                            segment.stats.users) *
                          100
                  });
                })
            );
          }
        });
        return Promise.all(promises2);
      })
    );
  }

  return Promise.all(promises)
    .catch(err => {
      status = "error";
      messages.push(err.message);
    })
    .then(() => {
      return { status, messages };
    });
}

module.exports = statusCheckAction;
