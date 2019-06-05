// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullSettingsResponse
} from "hull";
import moment from "moment";

const SyncAgent = require("../lib/sync-agent");

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullSettingsResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const {
    token,
    refresh_token,
    portal_id,
    last_fetch_started_at,
    fetch_count = 0,
    fetch_account_count = 0
  } = private_settings;

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
    const date = moment(last_fetch_started_at).format(
      "MM/DD/YY [@] H[h]mm"
    );

    const html = `Connected to portal <span>${portal_id}</span>. <span>${fetch_count}</span> users and <span>${fetch_account_count}</span> accounts fetched on <span>${date}</span>`;
    const message = `Connected to portal ${portal_id}. ${fetch_count} users and ${fetch_account_count} accounts fetched on ${date}`;
    return {
      status: 200,
      data: {
        message,
        html
      }
    };
  } catch (err) {
    return {
      status: 400,
      data: {
        message: err.message
      }
    };
  }
};

export default statusHandler;
