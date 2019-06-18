const _ = require("lodash");
const { Router } = require("express");
const bodyParser = require("body-parser");
const oauth2Factory = require("simple-oauth2");
const rp = require("request-promise");
const {
  clientMiddleware,
  credentialsFromQueryMiddleware,
  fullContextFetchMiddleware
} = require("hull/src/middlewares");

const shipAppFactory = require("./ship-app-factory");

const homeUrl = "/";
const callbackUrl = "/callback";
const selectUrl = "/select";
const syncUrl = "/sync";
const site = "https://login.mailchimp.com";
const tokenPath = "/oauth2/token";
const authorizationPath = "/oauth2/authorize";
const name = "Mailchimp";

const OAuthFactory = ({ clientID, clientSecret }) => {
  const oauth2 = oauth2Factory({
    name,
    clientID,
    clientSecret,
    site,
    tokenPath,
    authorizationPath,
    headers: {
      "User-Agent": "hull",
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  /**
   * If we got auth error let's clear api key and redirect to first step
   * of the ship installation - this is the case when user deleted the api key
   * for the ship mailchimp application and we need to ask for the permission
   * once again
   */
  function mailchimpErrorHandler(req, res, ship, client, err) {
    if (err.statusCode === 401) {
      client.logger.debug(
        "Mailchimp /lists query returned 401 - ApiKey is invalid"
      );
      client
        .put(ship.id, {
          private_settings: _.merge({}, ship.private_settings, {
            api_key: null,
            mailchimp_list_id: null
          })
        })
        .then(() => {
          return res.redirect(
            `${req.baseUrl}${homeUrl}?hullToken=${req.hull.clientCredentialsToken}`
          );
        });
    } else {
      // TODO add an error page template to display uncaught errors
      res.status(500).end(`Error: ${err.statusCode} -- ${err.message}`);
    }
  }

  function renderHome(req, res) {
    const { connector } = req.hull;
    const {
      api_key: apiKey,
      mailchimp_list_id: mailchimpListId,
      api_endpoint: apiEndpoint
    } = connector.private_settings || {};
    const redirect_uri = `https://${req.hostname}${req.baseUrl}${callbackUrl}?hullToken=${req.hull.clientCredentialsToken}`;
    const viewData = {
      name,
      url: oauth2.authCode.authorizeURL({ redirect_uri })
    };
    if (!apiKey || !apiEndpoint) {
      return res.render("login.html", viewData);
    }

    if (!mailchimpListId) {
      return res.redirect(
        `${req.baseUrl}${selectUrl}?hullToken=${req.hull.clientCredentialsToken}`
      );
    }

    return res.redirect(
      `${req.baseUrl}${syncUrl}?hullToken=${req.hull.clientCredentialsToken}`
    );
  }

  function renderRedirect(req, res) {
    const { connector, client } = req.hull;

    const code = req.query.code;
    const redirect_uri = `https://${req.hostname}${req.baseUrl}${callbackUrl}?hullToken=${req.hull.clientCredentialsToken}`;
    const form = {
      grant_type: "authorization_code",
      client_id: clientID,
      client_secret: clientSecret,
      code,
      redirect_uri
    };

    function saveToken(body = {}) {
      try {
        const message = JSON.parse(body);
        if (message && message.error) {
          return res.send(`Error: ${message.error}`);
        }
        if (message && message.access_token) {
          return rp({
            uri: "https://login.mailchimp.com/oauth2/metadata",
            method: "GET",
            json: true,
            auth: {
              bearer: message.access_token
            }
          })
            .then(
              (b = {}) =>
                client.put(connector.id, {
                  private_settings: _.merge({}, connector.private_settings, {
                    domain: b.dc,
                    api_key: message.access_token,
                    api_endpoint: b.api_endpoint
                  })
                }),
              err => res.send(err)
            )
            .then(() => res.render("finished.html"), err => res.send(err));
        }
        return res.send(`Could not find access token in ${body}`);
      } catch (e) {
        return res.send(`Could not parse response: ${body}`);
      }
    }

    rp({
      uri: "https://login.mailchimp.com/oauth2/token",
      method: "POST",
      headers: { "User-Agent": "node-mailchimp/1.1.6" },
      form
    }).then(saveToken, err => res.send(err));
  }

  function renderSelect(req, res) {
    const { connector, client } = req.hull;
    const { api_key: apiKey, mailchimp_list_id, api_endpoint } =
      connector.private_settings || {};
    const viewData = {
      name,
      form_action: `https://${req.hostname}${req.baseUrl}${selectUrl}?hullToken=${req.hull.clientCredentialsToken}`,
      mailchimp_list_id
    };
    rp({
      uri: `${api_endpoint}/3.0/lists`,
      qs: {
        fields: "lists.id,lists.name",
        count: 250
      },
      headers: { Authorization: `OAuth ${apiKey}` },
      json: true
    }).then(data => {
      viewData.mailchimp_lists = _.sortBy(data.lists, list =>
        (list.name || "").toLowerCase()
      );

      return res.render("admin.html", viewData);
    }, mailchimpErrorHandler.bind(this, req, res, connector, client));
  }

  function handleSelect(req, res) {
    const { connector = {}, client } = req.hull;
    const { api_key: apiKey, api_endpoint } = connector.private_settings || {};
    const list_id = req.body.mailchimp_list_id;
    rp({
      uri: `${api_endpoint}/3.0/lists/${list_id}`,
      qs: {
        fields: "id,name"
      },
      headers: { Authorization: `OAuth ${apiKey}` },
      json: true
    }).then(data => {
      return client
        .put(connector.id, {
          private_settings: _.merge({}, connector.private_settings, {
            mailchimp_list_id: data.id,
            mailchimp_list_name: data.name
          })
        })
        .then(() => {
          return res.redirect(
            `${req.baseUrl}${syncUrl}?hullToken=${req.hull.clientCredentialsToken}`
          );
        });
    }, mailchimpErrorHandler.bind(this, req, res, connector, client));
  }

  function renderSync(req, res) {
    const { connector = {} } = req.hull;
    const { mailchimp_list_name } = connector.private_settings || {};
    const shipApp = shipAppFactory(req.hull);
    shipApp.syncAgent.auditUtil
      .getAudit()
      .then(audit => {
        const viewData = {
          name,
          select_url: `https://${req.hostname}${req.baseUrl}${selectUrl}?hullToken=${req.hull.clientCredentialsToken}`,
          form_action: `https://${req.hostname}/sync?hullToken=${req.hull.clientCredentialsToken}`,
          audit,
          mailchimp_list_name,
          _
        };
        return res.render("sync.html", viewData);
      })
      .catch(error => {
        req.hull.client.logger.error("connector.oauth.error", error);
        const viewData = {
          name,
          select_url: `https://${req.hostname}${req.baseUrl}${selectUrl}?hullToken=${req.hull.clientCredentialsToken}`,
          form_action: `https://${req.hostname}/sync?hullToken=${req.hull.clientCredentialsToken}`,
          audit: {},
          mailchimp_list_name,
          _
        };
        return res.render("sync.html", viewData);
      });
  }

  const router = Router();
  router.use(function clearShipCache(req, res, next) {
    // the admin dashboard needs fresh information about
    // ship settings to decide which pane to show.
    // following workaround makes hull client middleware to force
    // ship settings refresh.
    req.hull = req.hull || {};
    req.hull.message = req.hull.message || {};
    req.hull.message.Subject = "ship:update";
    next();
  });
  router.use(credentialsFromQueryMiddleware());
  router.use(clientMiddleware());
  router.use(fullContextFetchMiddleware());
  router.get(homeUrl, renderHome);
  router.get(callbackUrl, renderRedirect);
  router.get(selectUrl, renderSelect);
  router.get(syncUrl, renderSync);

  router.post(
    selectUrl,
    bodyParser.urlencoded({ extended: true }),
    handleSelect
  );

  return router;
};

module.exports = OAuthFactory;
