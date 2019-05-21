// @flow
import type {
  HullContext,
  HullStatusResponse,
  HullIncomingHandlerMessage
} from "hull";

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullStatusResponse => {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { oauth = {}, form_id } = private_settings;
  const { access_token, refresh_token, expires_in, tokens_granted_at } = oauth;
  if (
    access_token &&
    refresh_token &&
    expires_in &&
    tokens_granted_at &&
    form_id
  ) {
    return {
      status: "ok",
      message: "Connected to Typeform"
    };
  }
  return {
    status: "setupRequired",
    messages: ["Credentials are empty, please authorize the connector"]
  };
};

export default statusHandler;
