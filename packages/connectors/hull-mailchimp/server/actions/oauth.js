// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

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
    const { connector } = ctx;
    const { private_settings = {} } = connector;
    const { access_token } = private_settings;

    if (access_token) {
      return {
        status: 200,
        data: {}
      };
    }
    throw new Error("Can't find access token");
  },
  onAuthorize: async (
    ctx: HullContext,
    message: string
  ): HullOAuthAuthorizeResponse => {
    const { account } = message;
    if (!account) {
      return undefined;
    }
    const { accessToken, refreshToken, params = {} } = account;
    return {
      private_settings: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: params.expires_in,
        tokens_granted_at: moment().format("X")
      }
    };
  }
});
