// @flow
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

import rp from "request-promise";

const onAuthorize = async (
  ctx: HullContext,
  message: HullOauthAuthorizeMessage
): HullOAuthAuthorizeResponse => {
  const { account } = message;
  if (!account) {
    throw new Error("Not properly authenticatd, please start again");
  }
  const { accessToken: api_key } = account;
  const { dc: domain, api_endpoint } = await rp({
    uri: "https://login.mailchimp.com/oauth2/metadata",
    method: "GET",
    json: true,
    auth: { bearer: api_key }
  });

  return {
    private_settings: {
      domain,
      api_key,
      api_endpoint,
      mailchimp_list_id: null,
      mailchimp_list_name: null
    }
  };
};
export default onAuthorize;
