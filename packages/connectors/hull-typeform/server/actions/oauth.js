// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const TypeformStrategy = require("passport-typeform").Strategy;
const moment = require("moment");
// const debug = require("debug")("hull-typeform:oauth");

const SyncAgent = require("../lib/sync-agent");

module.exports = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullOAuthHandlerParams => ({
  Strategy: TypeformStrategy,
  clientID,
  clientSecret,
  isSetup: async (
    ctx: HullContext,
    _message: HullIncomingHandlerMessage
  ): HullExternalResponse => {
    const { connector } = ctx;
    const { private_settings = {} } = connector;
    const { access_token, refresh_token, form_id } = private_settings;

    if (access_token && refresh_token) {
      const syncAgent = new SyncAgent(ctx);
      if (form_id) {
        const completed = await syncAgent.getFormResponsesCount();
        return {
          status: 200,
          data: {
            message: `Completed form submissions: ${completed}`,
            completed,
            form_present: true
          }
        };
      }
      return {
        status: 200,
        data: { form_present: false }
      };
    }
    throw new Error("Can't find Access token or refresh token");
  },
  onAuthorize: async (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
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
