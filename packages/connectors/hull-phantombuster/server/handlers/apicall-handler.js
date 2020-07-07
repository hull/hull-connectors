// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import _ from "lodash";
import callApi from "../lib/call-api";
import updateAgentDetails from "../lib/agent-details";

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
      const newAgent = await updateAgentDetails(ctx, true);
      const data = await callApi(ctx, newAgent);
      const result = await asyncComputeAndIngest(ctx, {
        source: "phantombuster",
        EntryModel,
        date: newAgent.date,
        payload: {
          method: "GET",
          url: newAgent.name,
          agent: newAgent,
          data: preview ? _.take(data, 100) : data,
          variables: varsFromSettings(ctx)
        },
        code,
        preview
      });
      if (!preview) {
        // $FlowFixMe
        ctx.enqueue("fetchAll", { agent: newAgent });
      }
      return {
        status: 200,
        data: { ...result, agent: newAgent }
      };
    } catch (err) {
      const error = err?.response?.body || err?.message || err;
      client.logger.error("connector.request.error", {
        ...private_settings,
        error
      });
      return {
        status: 500,
        error
      };
    }
  };
}
