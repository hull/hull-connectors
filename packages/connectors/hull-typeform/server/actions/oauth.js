// @flow
import type { HullOAuthRequest, HullOAuthHandlerParams } from "hull";

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
  isSetup: async (req: HullOAuthRequest) => {
    const {
      access_token,
      refresh_token,
      form_id
    } = req.hull.connector.private_settings;

    if (access_token && refresh_token) {
      const syncAgent = new SyncAgent(req.hull);
      if (form_id) {
        const completed = await syncAgent.getFormResponsesCount();
        return {
          status: 200,
          data: { completed, form_present: true }
        };
      }
      return {
        status: 200,
        data: { form_present: false }
      };
    }
    throw new Error("Can't find Access token or refresh token");
  },
  onLogin: async () => Promise.resolve(),
  onAuthorize: async (req: HullOAuthRequest) => {
    const { account } = req;
    if (!account) {
      return undefined;
    }
    const { accessToken, refreshToken, params = {} } = account;
    return req.hull.helpers.settingsUpdate({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: params.expires_in,
      tokens_granted_at: moment().format("X")
    });
  }
});
