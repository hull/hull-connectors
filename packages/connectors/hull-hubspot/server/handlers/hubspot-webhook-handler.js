// @flow

import type { HullRequest, HullResponse } from "hull/src/types";
import getMessage from "hull/src/utils/get-message-from-request";
import jwt from "jwt-simple";
import { encrypt } from "hull/src/utils/crypto";
import HullClient from "hull-client";
import incomingWebhooksHandler from "./incoming-webhooks-handler";

const _ = require("lodash");

async function fetchConnector(ctx): Promise<*> {
  if (ctx.connector) {
    return Promise.resolve(ctx.connector);
  }
  return ctx.cache.wrap(
    "connector",
    () => {
      return ctx.client.get("app", {});
    },
    { ttl: 60000 }
  );
}

function generateToken(clientCredentials, secret) {
  return jwt.encode(clientCredentials, secret);
}
function generateEncryptedToken(clientCredentials, secret) {
  return encrypt(clientCredentials, secret);
}
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

async function hubspotWebhookHandler(req: HullRequest, res: HullResponse) {
  const message = getMessage(req);
  const clientCredentialsArray = await getClientCredentials(req);
  const requestId = "requests-buffer";
  const { hostSecret } = req.hull.connectorConfig;

  for (let i = 0; i < clientCredentialsArray.length; i += 1) {
    const request = _.cloneDeep(req);
    const clientCredentials = clientCredentialsArray[i];

    const clientCredentialsToken = generateToken(clientCredentials, hostSecret);
    const clientCredentialsEncryptedToken = generateEncryptedToken(
      clientCredentials,
      hostSecret
    );

    request.hull = Object.assign(request.hull, {
      requestId,
      clientCredentials,
      clientCredentialsToken,
      clientCredentialsEncryptedToken
    });

    const HullClientClass = request.hull.HullClient || HullClient;
    const mergedClientConfig = {
      ...request.hull.clientConfig,
      ...request.hull.clientCredentials,
      requestId: request.hull.requestId
    };

    request.hull.client = new HullClientClass(mergedClientConfig);

    try {
      const connector = await fetchConnector(request.hull);

      if (!_.isNil(connector)) {
        request.hull = Object.assign(request.hull, {
          connector
        });
        incomingWebhooksHandler(request.hull, message);
      }
    } catch (err) {
      // TODO remove connector config from cache
      console.log(`ERROR - Connector Not Found: ${err}`);
    }
  }

  res.sendStatus(200);
  return res.end("ok");
}

module.exports = hubspotWebhookHandler;
