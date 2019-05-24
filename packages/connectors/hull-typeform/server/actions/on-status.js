// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullOAuthStatusResponse
} from "hull";

const SyncAgent = require("../lib/sync-agent");

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullOAuthStatusResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { oauth, form_id } = private_settings;
  const { access_token, refresh_token, expires_in, tokens_granted_at } = oauth;

  if (
    access_token &&
    refresh_token &&
    form_id &&
    expires_in &&
    tokens_granted_at
  ) {
    const syncAgent = new SyncAgent(ctx);
    const completed = await syncAgent.getFormResponsesCount();
    return {
      status: 200,
      data: {
        message: `Completed form submissions: ${completed}`
      }
    };
  }
  return {
    status: 400,
    data: {
      message: "Can't find Access token or refresh token"
    }
  };
};

export default statusHandler;
