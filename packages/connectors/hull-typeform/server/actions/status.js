// @flow
import type {
  HullContext,
  HullStatusResponse,
  HullIncomingHandlerMessage
} from "hull";

const SyncAgent = require("../lib/sync-agent");

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullStatusResponse => {
  const { connector } = ctx;
  const { private_settings } = connector;
  const {
    access_token,
    refresh_token,
    expires_in,
    tokens_granted_at,
    form_id
  } = private_settings;
  if (access_token && refresh_token && expires_in && tokens_granted_at) {
    if (!form_id) {
      return {
        status: "warning",
        message:
          "Please select a Form to import in the Settings of this connector"
      };
    }

    const completed = await new SyncAgent(ctx).getFormResponsesCount();

    return {
      status: "ok",
      messages: [
        `Connected to Typeform ${form_id}`,
        `Form submissions: ${completed}`
      ]
    };
  }
  return {
    status: "setupRequired",
    message: "Credentials are empty, please authorize the connector"
  };
};

export default statusHandler;
