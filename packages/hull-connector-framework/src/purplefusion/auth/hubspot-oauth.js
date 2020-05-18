/* @flow */
import type { HullContext, HullExternalResponse, HullIncomingHandlerMessage } from "hull";

const HubspotStrategy = require("passport-hubspot-oauth2.0");
const { oAuthHandler } = require("hull/src/handlers");
const moment = require("moment");
const Promise = require("bluebird");
const debug = require("debug")("hull-hubspot:oauth");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

const hubspotOAuth = {
    onStatus: (req, authorizationMessage) => {
      const { connector } = req;
      const { private_settings = {} } = connector;
      const {
        portal_id
      } = private_settings;

      if (portal_id) {
        const html = `Connected to portal <span>${portal_id}</span>`;
        const message = `Connected to portal ${portal_id}`;
        return {
          status: 200,
          data: {
            message,
            html
          }
        };
      }
      return {
        status: 400,
        data: {
          message: "Please authenticate"
        }
      };
    },
    onLogin: (
      ctx: HullContext,
      message: HullIncomingHandlerMessage
    ): HullExternalResponse => ({
      ...message.body,
      ...message.query
    }),
    onAuthorize: (req, authorizationMessage) => {
      debug("onAuthorize req.account", authorizationMessage.account);
      const { refreshToken, accessToken } = authorizationMessage.account || {};
      const { expires_in } = authorizationMessage.account.params;

      const agent = superagent
        .agent()
        .use(superagentUrlTemplatePlugin({}))
        .use(
          prefixPlugin(
            process.env.OVERRIDE_HUBSPOT_URL || "https://api.hubapi.com"
          )
        )
        .set("Authorization", `Bearer ${accessToken}`)
        .timeout({
          response: 5000
        });

      return agent
        .get(`/oauth/v1/access-tokens/${accessToken}`)
        .then(res => {
          const portalId = res.body.hub_id;
          return {
            private_settings: {
              portal_id: portalId,
              refresh_token: refreshToken,
              access_token: accessToken,
              expires_in,
              token_fetched_at: moment()
                .utc()
                .format("x")
            }
          }
        });
    }
};

module.exports = {
  hubspotOAuth
};
