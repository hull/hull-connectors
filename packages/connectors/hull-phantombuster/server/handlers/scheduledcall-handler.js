// @flow

import type {
  HullContext,
  // HullResponse,
  HullExternalResponse
} from "hull";
import updateAgentDetails from "../lib/agent-details";

const scheduledCall = async (ctx: HullContext): HullExternalResponse => {
  const { client, connector } = ctx;
  const { private_settings = {} } = connector;

  try {
    const agent = await updateAgentDetails(ctx, true);
    const { isNew } = agent;
    if (!isNew) {
      client.logger.info("connector.schedule.skip", {
        message: "Phantom didn't change since last time",
        agent
      });
      return {
        status: 200,
        data: {
          ok: true
        }
      };
    }
    const data = ctx.enqueue("fetchAll", { agent });

    return {
      status: 200,
      data
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

export default scheduledCall;
