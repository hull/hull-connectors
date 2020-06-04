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
      client.logger.info("incoming.job.skip", {
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

    return { status: 200, data };
  } catch (err) {
    const error = err?.response?.body || err?.message || err;
    client.logger.error("incoming.job.error", {
      ...private_settings,
      error
    });
    return {
      status: 500,
      error
    };
  }
};

export default scheduledCall;
