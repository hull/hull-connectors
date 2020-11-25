// @flow

import type { HullRequest, HullResponse } from "hull/src/types";
import getMessage from "hull/src/utils/get-message-from-request";

import BluebirdPromise from "bluebird";
import incomingWebhooksHandler from "../actions/incoming-webhook";

const { extendedComposeMiddleware } = require("hull/src/middlewares");

const _ = require("lodash");

async function getClientCredentials(req) {
  const clientCredentials = [];
  const clientConfig = _.get(req, "hull.clientConfig");
  const connectorName = _.get(clientConfig, "connectorName", "hubspot");

  const serviceKey = _.get(clientConfig, "cachedCredentials.serviceKey", null);

  if (!_.isNil(serviceKey)) {
    const serviceValue = _.get(req, serviceKey, null);
    if (!_.isNil(serviceValue)) {
      return req.hull.cache.cache.get(`${connectorName}:${serviceValue}`);
    }
  }

  return clientCredentials;
}

function sendResponse(res) {
  res.sendStatus(200);
  return res.end("ok");
}

async function middleware(request, res) {
  const requestName = "requests-buffer";
  try {
    await BluebirdPromise.mapSeries(
      extendedComposeMiddleware({
        requestName,
        handlerName: "webhook",
        options: {
          credentialsFromQuery: true,
          credentialsFromNotification: false,
          cacheContextFetch: true
        }
      }),
      async mw => mw(request, res, () => {})
    );
    const { connector } = request.hull;
    if (!connector || connector.accept_incoming_webhooks === false) {
      // TODO remove connector config from cache
      return false;
    }
  } catch (err) {
    console.error("Error in Webhook Handler", err);
    return false;
  }
  return true;
}

async function processRequest(request, res, message) {
  try {
    const shouldProcess = await middleware(request, res);
    if (shouldProcess) {
      return incomingWebhooksHandler(request.hull, message);
    }
  } catch (err) {
    console.log(err);
  }
  return Promise.resolve();
}

async function hubspotWebhookHandler(req: HullRequest, res: HullResponse) {
  const message = getMessage(req);
  const clientCredentialsArray = await getClientCredentials(req);

  if (_.isNil(clientCredentialsArray)) {
    // if there are no cached credentials, check if we
    // can get it through the query
    await processRequest(req, res, message);
    return sendResponse(res);
  }

  for (let i = 0; i < clientCredentialsArray.length; i += 1) {
    const clientCredentials = clientCredentialsArray[i];

    req.hull = Object.assign(req.hull, { clientCredentials });

    // eslint-disable-next-line
    await processRequest(req, res, message);
  }
  return sendResponse(res);
}

module.exports = hubspotWebhookHandler;
