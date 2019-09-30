// @flow

import type { HullRequest, HullResponse } from "hull/src/types";
import type { NextFunction } from "express";
import getMessage from "hull/src/utils/get-message-from-request";

import incomingWebhooksHandler from "../actions/incoming-webhook";

const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  fullContextFetchMiddleware,
  fullContextBodyMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware,
  httpClientMiddleware
} = require("hull/src/middlewares");

const _ = require("lodash");

async function getClientCredentials(req) {
  const clientCredentials = [];
  const clientConfig = _.get(req, "hull.clientConfig");
  const connectorName = _.get(clientConfig, "connectorName", "hubspot");

  const path = _.get(clientConfig, "cachedCredentials.payloadPath", null);
  const field = _.get(clientConfig, "cachedCredentials.field", null);

  if (!_.isNil(path) && !_.isNil(field)) {
    const payload = _.get(req, path, {});
    const credentialsKey = _.get(payload, field, "");
    return req.hull.cache.cache.get(`${connectorName}:${credentialsKey}`);
  }

  return clientCredentials;
}

function sendResponse(res) {
  res.sendStatus(200);
  return res.end("ok");
}

async function hubspotWebhookHandler(req: HullRequest, res: HullResponse) {
  const requestName = "requests-buffer";
  const message = getMessage(req);
  const clientCredentialsArray = await getClientCredentials(req);

  if (_.isNil(clientCredentialsArray)) {
    return sendResponse(res);
  }

  for (let i = 0; i < clientCredentialsArray.length; i += 1) {
    const request = _.cloneDeep(req);
    const clientCredentials = clientCredentialsArray[i];

    request.hull = Object.assign(request.hull, { clientCredentials });

    try {
      credentialsFromQueryMiddleware()(request, res, () => {});
      clientMiddleware()(request, res, () => {});
      timeoutMiddleware()(request, res, () => {});
      haltOnTimedoutMiddleware()(request, res, () => {});
      instrumentationContextMiddleware({})(request, res, () => {});
      fullContextBodyMiddleware({ requestName })(request, res, () => {});
      // eslint-disable-next-line
      await fullContextFetchMiddleware({ requestName })(request, res, () => {});
      httpClientMiddleware()(request, res, () => {});

      incomingWebhooksHandler(request.hull, message);
    } catch (err) {
      // TODO remove connector config from cache
      console.log(`ERROR - Connector Not Found: ${err}`);
    }
  }
  return sendResponse(res);
}

module.exports = hubspotWebhookHandler;
