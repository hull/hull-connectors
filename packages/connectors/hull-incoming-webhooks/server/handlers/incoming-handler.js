/* @flow */
import _ from "lodash";
import type {
  HullContext,
  HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import compute from "../lib/compute";
import ingest from "../lib/ingest";
import type { Payload } from "../../types";

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

export default function handler(EntryModel: Object) {
  return async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage,
    res: HullResponse
  ): Promise<HullExternalResponse> => {
    const { client, connector, metric } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;

    // Stop if we aren't initialized properly, notifying sender that we couldn't find the proper credentials
    if (!client || !connector) {
      return {
        status: 404,
        json: {
          reason: "connector_not_found",
          message: "We couldn't find a connector for this token"
        }
      };
    }

    res.send(200);

    const payload: Payload = pickValuesFromRequest(message);
    client.logger.debug("connector.request.data", payload);
    const result = await compute({
      payload,
      connector,
      client,
      code,
      preview: false
    });

    try {
      ingest(
        {
          payload,
          code,
          result,
          connector,
          client,
          metric
        },
        EntryModel
      );
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
    return undefined;
  };
}
