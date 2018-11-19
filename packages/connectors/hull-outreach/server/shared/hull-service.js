/* @flow */
import type { HullClientLogger, HullContext } from "hull";
import type { CustomApi } from "./types";

const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");
const { Client } = require("hull");

const _ = require("lodash");

const {
  HullIncomingUser,
  HullIncomingAccount
} = require("./hull-service-objects");

// should be a generically instantiated class which take
// transforms-to-hull.js
// and maps the data back to account and traits calls....

class HullSdk {

  client: Client;
  api: CustomApi;
  metricsClient: MetricAgent;
  loggerClient: HullClientLogger;
  helpers: Object;

  constructor(reqContext: HullContext, api: CustomApi) {
    this.client = reqContext.client;
    this.api = api;
    this.loggerClient = reqContext.client.logger;
    this.metricsClient = reqContext.metric;
    this.helpers = reqContext.helpers;
  }

  async dispatch(endpointName: string, params: any) {
    this.metricsClient.increment("ship.service_api.call", 1);
    const endpoint = this.api.endpoints[endpointName];
    if (typeof endpoint.method === "string") {
      return this[endpoint.method](params);
    } else {
        endpoint.method(params);
      }
  }

  upsertHullUser(user: HullIncomingUser) {
    // Logs etc...
    const asUser = this.client.asUser(user.ident);

    const userPromise = asUser.traits(user.attributes);

    if (!_.isEmpty(user.accountIdent)) {
      userPromise.then(() => {
        return asUser.account(user.accountIdent).traits({});
      });
    }

    return userPromise;
  }

  upsertHullAccount(account: HullIncomingAccount) {
    // Logs etc..
    return this.client.asAccount(account.ident).traits(account.attributes);
  }

  connectorSettingsUpdate(settings: any) {
    return this.helpers.settingsUpdate(settings);
  }
}

const hullService: CustomApi = {
  initialize: (context, api) => new HullSdk(context, api),
  isAuthenticated: {},
  retry: {},
  error: {},
  endpoints: {
    asUser: {
      method: "upsertHullUser",
      endpointType: "upsert",
      input: HullIncomingUser
    },
    asAccount: {
      method: "upsertHullAccount",
      endpointType: "upsert",
      input: HullIncomingAccount
    },
    settingsUpdate: {
      method: "connectorSettingsUpdate",
      endpointType: "upsert"
    },
  }
};

module.exports = {
  HullSdk,
  hullService
};
