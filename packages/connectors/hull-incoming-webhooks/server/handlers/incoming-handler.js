/* @flow */
import _ from "lodash";
import type {
  HullContext,
  // HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import compute from "../lib/compute";
import ingest from "../lib/ingest";
import type { Payload } from "../../types";

// const debug = require("debug")("hull-incoming-webhooks:incoming");

const pickValuesFromRequest = ({
  body,
  headers,
  cookies,
  ip,
  method,
  params,
  query
}: HullIncomingHandlerMessage) => ({
  body,
  cookies,
  ip,
  method,
  params,
  query,
  headers: _.omit(headers, [
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-newrelic-id",
    "x-newrelic-transaction"
  ])
});

const asyncComputeAndIngest = async ({
  EntryModel,
  metric,
  payload,
  connector,
  client,
  code
}) => {
  try {
    const result = await compute({
      context: payload,
      connector,
      client,
      code,
      preview: false
    });
    ingest({ payload, code, result, connector, client, metric }, EntryModel);
  } catch (err) {
    client.logger.error("incoming.user.error", {
      hull_summary: `Error Processing user: ${_.get(
        err,
        "message",
        "Unexpected error"
      )}`,
      err
    });
  }
};

export default function handler(EntryModel: Object) {
  return async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullExternalResponse => {
    const { client, connector, metric } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;

    // Stop if we aren't initialized properly, notifying sender that we couldn't find the proper credentials
    if (!client || !connector) {
      return {
        status: 404,
        data: {
          reason: "connector_not_found",
          message: "We couldn't find a connector for this token"
        }
      };
    }

    // res.sendStatus(200);

    const payload: Payload = pickValuesFromRequest(message);
    client.logger.debug(
      "connector.request.data",
      _.pick(payload, "body", "method", "params", "query")
    );
    asyncComputeAndIngest({
      EntryModel,
      metric,
      payload,
      connector,
      client,
      code
    });
    // return undefined;
    return {
      status: 200,
      data: {
        ok: true
      }
    };
  };
}
