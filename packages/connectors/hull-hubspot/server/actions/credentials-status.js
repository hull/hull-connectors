// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const SyncAgent = require("../lib/sync-agent");

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { oauth } = private_settings;
  const { token, refresh_token, portal_id } = oauth;

  try {
    if (!portal_id || !token || !refresh_token) {
      throw new Error("Can't find access token");
    }
    const syncAgent = new SyncAgent(ctx);
    // TODO: we have notices problems with syncing hull segments property
    // TODO: check if below code works after hull-node upgrade.
    // after a Hubspot resync, there may be a problem with notification
    // subscription. Following two lines fixes that problem.
    // AppMiddleware({ queueAdapter, shipCache, instrumentationAgent })(req, {}, () => {});
    await syncAgent.syncConnector();
    return {
      status: 200,
      data: {
        messages: [`Connected to portal: ${portal_id}`]
      }
    };
  } catch (err) {
    return {
      status: 400,
      data: {
        messages: [err.message]
      }
    };
  }
};

export default statusHandler;
