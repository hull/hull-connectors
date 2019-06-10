// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

import rp from "request-promise";

const MailchimpStrategy = require("passport-mailchimp").Strategy;
const moment = require("moment");

const SyncAgent = require("../lib/sync-agent");

module.exports = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullOAuthHandlerParams => ({
  Strategy: MailchimpStrategy,
  clientID,
  clientSecret,
  isSetup: async (
    ctx: HullContext,
    _message: HullIncomingHandlerMessage
  ): HullExternalResponse => {
    const { connector, clientCredentialsEncryptedToken } = ctx;
    const { private_settings = {} } = connector;
    const {
      mailchimp_list_id,
      api_key,
      api_endpoint,
      domain
    } = private_settings;

    if (api_key && api_endpoint && domain) {
      return {
        status: 200,
        data: {
          url: mailchimp_list_id
            ? ""
            : `/select?hullToken=${clientCredentialsEncryptedToken}`
        }
      };
    }
    return {
      status: 200,
      data: {
        url: `/auth/login?hullToken=${clientCredentialsEncryptedToken}`
      }
    };
  },
  onAuthorize: async (
    ctx: HullContext,
    message: string
  ): HullOAuthAuthorizeResponse => {
    const { account } = message;
    if (!account) {
      return undefined;
    }
    const { accessToken } = account;
    const data = await rp({
      uri: "https://login.mailchimp.com/oauth2/metadata",
      method: "GET",
      json: true,
      auth: {
        bearer: accessToken
      }
    });
    return {
      private_settings: {
        domain: data.dc,
        api_key: accessToken,
        api_endpoint: data.api_endpoint
      }
    };
  }
});
