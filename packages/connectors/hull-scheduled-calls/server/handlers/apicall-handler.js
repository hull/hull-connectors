// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import callApi from "../lib/call-api";

export default function handler(EntryModel: Object) {
  return async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullExternalResponse => {
    const { client, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;
    // $FlowFixMe
    const { preview } = message.body;

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

    try {
      const payload = await callApi(ctx);
      const result = await asyncComputeAndIngest(ctx, {
        source: "scheduled-calls",
        EntryModel,
        payload: {
          ...payload,
          variables: varsFromSettings(ctx)
        },
        code,
        preview
      });
      return {
        status: 200,
        data: result
      };
    } catch (err) {
      client.logger.error("connector.request.error", {
        ...private_settings,
        error: err
      });
      return {
        status: 500,
        data: {
          error: err
        }
      };
    }
  };
}
