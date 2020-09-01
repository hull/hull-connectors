// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import _ from "lodash";
import fetchOutput from "../lib/fetch-output";
import updateAgentDetails from "../lib/agent-details";

type AgentResponse = { agent: {}, org: {} };
type Output = {};

export default function handler(EntryModel: Object) {
  return async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullExternalResponse => {
    const { client, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code, agent_id } = private_settings;
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
    if (!agent_id) {
      return {
        status: 404,
        data: {
          reason: "agent_not_configured",
          message:
            "Can't find an Agent ID in your settings, please pick an Agent to run in the Hull Connector Settings"
        }
      };
    }

    try {
      const responses = await Promise.all([
        updateAgentDetails(ctx, true),
        fetchOutput(ctx, agent_id)
      ]);
      const [{ agent, org }, output]: [AgentResponse, Output] = responses;
      if (!output || !output.length) {
        client.logger.error("connector.request.error", {
          message:
            "Could not find results in Phantombuster, check that the Agent has run successfully at least once",
          agent,
          output
        });
      }
      const result = await asyncComputeAndIngest(ctx, {
        source: "phantombuster",
        EntryModel,
        date: agent.date,
        payload: {
          method: "GET",
          url: agent.name,
          agent,
          org,
          data: preview ? _.take(output, 100) : output,
          variables: varsFromSettings(ctx)
        },
        code,
        preview
      });
      if (!preview) {
        // $FlowFixMe
        ctx.enqueue("fetchAll", { agent, org });
      }
      return {
        status: 200,
        data: { ...result, agent, org }
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
