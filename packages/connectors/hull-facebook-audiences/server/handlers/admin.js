/* @flow */
import type { HullContext, HullIncomingHandlerMessage } from "hull";

const fbgraph = require("fbgraph");
const Promise = require("bluebird");
const _ = require("lodash");
const debug = require("debug")("hull-facebook-audiences");
const FacebookAudience = require("../lib/facebook-audience");

function adminHander({ clientID, clientSecret }: any) {
  function getAccessToken({ facebook_access_token, extendAccessToken }) {
    return new Promise((resolve, reject) => {
      if (extendAccessToken && facebook_access_token) {
        fbgraph.extendAccessToken(
          {
            access_token: facebook_access_token,
            client_id: clientID,
            client_secret: clientSecret
          },
          (err, res) => {
            return err ? reject(err) : resolve(res.access_token);
          }
        );
      } else {
        resolve(facebook_access_token);
      }
    });
  }

  function updateSettings({ client, helpers, segments, metric, params }) {
    const { facebook_ad_account_id } = params;
    return getAccessToken(params)
      .then(facebook_access_token => {
        return helpers.settingsUpdate({
          facebook_access_token,
          facebook_ad_account_id
        });
      })
      .then(updatedShip => {
        const fb = new FacebookAudience(
          updatedShip,
          client,
          helpers,
          segments,
          metric
        );
        return fb.isConfigured() && fb.sync();
      });
  }

  function handleError(context, err = {}) {
    if (
      err.type === "OAuthException" &&
      (err.code === 100 || err.code === 190) // Token expired
    ) {
      err.title =
        "Expired or invalid token, please login again to facebook via the settings page";
      return {
        status: 200,
        pageLocation: "error.html",
        data: {
          ...context,
          error: err
        }
      };
    }
    err.title = `Error #${err.code} - ${err.type}`;
    if (err.code === 2655 || err.code === 2664) {
      err.title = "Terms of service has not been accepted.";
      err.action = {
        message: "Click here to accept them",
        url: `https://www.facebook.com/ads/manage/customaudiences/tos.php?act=${err.accountId}`
      };
    }

    return {
      status: 200,
      pageLocation: "error.html",
      data: {
        ...context,
        error: err
      }
    };
  }

  async function accountList(
    ctx: HullContext,
    _message: HullIncomingHandlerMessage
  ) {
    const {
      connector: ship,
      client,
      helpers,
      usersSegments: segments,
      metric
    } = ctx || {};
    const { facebook_ad_account_id } = ship.private_settings || {};
    try {
      const fb = new FacebookAudience(ship, client, helpers, segments, metric);
      const accounts = await fb.fetchAvailableAccounts();
      if (facebook_ad_account_id) {
        const acc = _.find(
          accounts,
          a => a.account_id === facebook_ad_account_id
        );
        return {
          status: 200,
          data: {
            options: [
              {
                label:
                  "Ad account selected. Please reinstall the connector to change it",
                options: [
                  {
                    label: `${acc.name} (${facebook_ad_account_id})`,
                    value: facebook_ad_account_id
                  }
                ]
              }
            ]
          }
        };
      }
      return {
        status: 200,
        data: {
          options: accounts.map(({ account_id: value, name: label }) => ({
            label: `${label} (${value})`,
            value
          }))
        }
      };
    } catch (error) {
      return {
        status: 400,
        error
      };
    }
  }

  async function getAudiences(
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ) {
    const {
      connector: ship,
      client,
      helpers,
      usersSegments: segments,
      metric
    } = ctx || {};
    const { query, url } = message;
    const fb = new FacebookAudience(ship, client, helpers, segments, metric);

    const { accessToken, accountId } = fb.getCredentials();
    const context = { fb, url, query, clientID };

    debug("admin.accessToken", typeof accessToken);
    if (!accessToken) {
      const error = {
        type: "Authorization issue",
        code: 401,
        title: "Connector unauthorized",
        message: "Please login to your facebook account via the settings tab."
      };
      return handleError(context, error);
    }
    if (!accountId) {
      const error = {
        type: "Configuration issue",
        code: 404,
        title: "Ad account not found",
        message:
          "Please select an ad account by navigating to the settings section of your connector."
      };
      return handleError(context, error);
    }
    try {
      const [
        audiences,
        segmentsToSpread,
        synchronizedSegments
      ] = await Promise.all([
        fb.fetchAudiences(),
        fb.client.get("segments"),
        fb.getSynchronizedSegments()
      ]);
      const detailedAudiences = await Promise.all(
        _.map(audiences, aud => fb.fetchAudienceDetails(aud.id))
      );
      return {
        status: 200,
        pageLocation: "audiences.html",
        data: {
          ...context,
          audiences: detailedAudiences,
          segments: segmentsToSpread,
          synchronizedSegments,
          _
        }
      };
    } catch (error) {
      client.logger.error("admin.error", error);
      return handleError(context, error);
    }
  }

  async function syncAudiences(
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ) {
    const {
      client,
      connector: ship,
      helpers,
      usersSegments: segments,
      metric
    } = ctx;
    const { query } = message;
    const context = { query, clientID, ship };
    const fb = new FacebookAudience(ship, client, helpers, segments, metric);
    if (fb.isConfigured()) {
      try {
        await fb.sync();
      } catch (error) {
        client.logger.error("admin.error", error);
        return handleError(context, error);
      }
    }

    return {
      status: 200,
      pageLocation: "synced.html",
      data: {}
    };
  }

  return {
    getAudiences,
    syncAudiences,
    accountList
  };
}

module.exports = adminHander;
