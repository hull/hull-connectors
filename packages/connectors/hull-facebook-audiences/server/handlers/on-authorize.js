// @flow
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const onAuthorize = async (
  ctx: HullContext,
  message: HullOauthAuthorizeMessage
): HullOAuthAuthorizeResponse => {
  const { account } = message;
  if (!account) {
    throw new Error("Not properly authenticatd, please start again");
  }
  const { accessToken: facebook_access_token } = account;

  return {
    private_settings: {
      facebook_access_token
    }
  };
};
export default onAuthorize;
