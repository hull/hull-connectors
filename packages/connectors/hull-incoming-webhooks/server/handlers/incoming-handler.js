// @flow

import _ from "lodash";
import type {
  HullContext,
  // HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import { pickValuesFromRequest, asyncComputeAndIngest } from "hull-vm";

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

    const payload = pickValuesFromRequest(message);

    client.logger.debug(
      "connector.request.data",
      _.pick(payload, "body", "method", "params", "query")
    );
    asyncComputeAndIngest(ctx, { EntryModel, payload, code });

    return {
      status: 200,
      data: {
        ok: true
      }
    };
  };
}
