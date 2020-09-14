/* @flow */
const { Router } = require("express");
const fbgraph = require("fbgraph");
const bodyParser = require("body-parser");
const Promise = require("bluebird");
const _ = require("lodash");
const debug = require("debug")("hull-facebook-audiences");
const FacebookAudience = require("../lib/facebook-audience");

function adminHander({ facebookAppSecret, facebookAppId }: any) {
  function getAccessToken({ facebook_access_token, extendAccessToken }) {
    return new Promise((resolve, reject) => {
      if (extendAccessToken && facebook_access_token) {
        fbgraph.extendAccessToken(
          {
            access_token: facebook_access_token,
            client_id: facebookAppId,
            client_secret: facebookAppSecret
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
        return helpers.updateSettings({
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
      (err.code === 100 || err.code === 190)
    ) {
      this.render("login.html", context);
    } else {
      err.title = `Error #${err.code} - ${err.type}`;
      if (err.code === 2655 || err.code === 2664) {
        err.title = "Terms of service has not been accepted.";
        err.action = {
          message: "Click here to accept them",
          url: `https://www.facebook.com/ads/manage/customaudiences/tos.php?act=${err.accountId}`
        };
      }

      this.render("error.html", { ...context, err });
    }
  }

  const app = Router();

  app.use(bodyParser.urlencoded({ extended: true }));

  app.post("/", (req, res) => {
    const params = req.body;
    const { client, ship, helpers, segments, metric } = req.hull;
    const context = {
      query: req.query,
      search: req.search,
      facebookAppId,
      ship
    };
    return updateSettings({ client, ship, helpers, segments, metric, params })
      .then(() => {
        res.redirect("back");
      })
      .catch(error => {
        client.logger.error("admin.error", error);
        handleError.call(res, context, error);
      });
  });

  app.post("/sync", (req, res) => {
    const { client, ship, helpers, segments, metric } = req.hull;
    const context = { query: req.query, facebookAppId, ship };
    const fb = new FacebookAudience(ship, client, helpers, segments, metric);
    if (fb.isConfigured()) {
      return fb
        .sync()
        .then(() => res.redirect("back"))
        .catch(error => {
          client.logger.error("admin.error", error);
          handleError.call(res, context, error);
        });
    }

    return res.redirect("back");
  });

  app.get("/", (req, res) => {
    const { ship, client, helpers, segments, metric } = req.hull || {};
    const fb = new FacebookAudience(ship, client, helpers, segments, metric);

    const { accessToken, accountId } = fb.getCredentials();
    const context = { fb, url: req.url, query: req.query, facebookAppId };

    debug("admin.accessToken", typeof accessToken);
    if (!accessToken) {
      res.render("login.html", context);
    } else if (!accountId) {
      fb.fetchAvailableAccounts()
        .then(accounts => res.render("accounts.html", { ...context, accounts }))
        .catch(handleError.bind(res, context));
    } else {
      Promise.all([
        fb.fetchAudiences(),
        fb.client.get("segments"),
        fb.getSynchronizedSegments()
      ])
        .spread((audiences, segmentsToSpread, synchronizedSegments) => {
          audiences = Promise.all(
            _.map(audiences, aud => fb.fetchAudienceDetails(aud.id))
          ).then(detailedAudiences => {
            return res.render("audiences.html", {
              ...context,
              audiences: detailedAudiences,
              segments: segmentsToSpread,
              synchronizedSegments,
              _
            });
          });
        })
        .catch(error => {
          client.logger.error("admin.error", error);
          handleError.call(res, context, error);
        });
    }
  });

  return app;
}

module.exports = adminHander;
