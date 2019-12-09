/* @flow */
import type { HullClientLogger, HullContext } from "hull";
import type { CustomApi } from "./types";

const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");
const { Client } = require("hull");
const HullVariableContext = require("./variable-context");

const _ = require("lodash");

const {
  HullIncomingUser,
  HullIncomingAccount,
  HullApiAttributeDefinition,
  HullIncomingUserImportApi,
  HullApiSegmentDefinition,
  HullApiEventDefinition
} = require("./hull-service-objects");

// should be a generically instantiated class which take
// transforms-to-hull.js
// and maps the data back to account and traits calls....

class HullSdk {

  client: Client;
  api: CustomApi;
  entities: Object;
  metricsClient: MetricAgent;
  loggerClient: HullClientLogger;
  helpers: Object;
  globalContext: HullVariableContext;

  constructor(globalContext: HullVariableContext, api: CustomApi) {
    this.entities = globalContext.reqContext().entities;
    this.client = globalContext.reqContext().client;
    this.api = api;
    this.loggerClient = globalContext.reqContext().client.logger;
    this.metricsClient = globalContext.reqContext().metric;
    this.helpers = globalContext.reqContext().helpers;
    this.globalContext = globalContext;
  }

  async dispatch(endpointName: string, params: any) {

    //TODO make this method generic across all sdks
    // use method if it exists, if not, just call use endpoint name
    // the endpoint definition in the service should only be used to augment the endpoint
    // with input and output
    // once abstracted, can add a level to return ServiceData if output is defined...
    const endpoint = _.get(this.api, `endpoints.${endpointName}`);
    if (endpoint && endpoint.method) {
      return this[endpoint.method](params);
    } else {
      this[endpointName](params);
    }
  }

  detachEntityFromService(entity: HullIncomingUser | HullIncomingAccount, upsertEntity: any, asEntity: any) {
    const service_name = this.globalContext.get("service_name");

    if (_.isNil(service_name)) {
      return Promise.resolve();
    }

    const deleted_at = _.get(entity, `attributes.${service_name}/deleted_at`);

    const identity = _.cloneDeep(entity.ident);
    const asHullEntity = asEntity(identity);

    if (_.isNil(deleted_at)) {
      asHullEntity.logger.info("Cannot detach from service.", { data: entity });
      return Promise.resolve();
    }

    _.set(entity, `attributes.${service_name}/id`, null);

    const upsert = _.bind(upsertEntity, this, entity);
    let entityPromise = upsert();

    const anonymous_id = _.get(identity, "anonymous_id", null);
    if (!_.isNil(anonymous_id)) {
      entityPromise = entityPromise.then(() => {
        return asHullEntity.unalias({ "anonymous_id": anonymous_id })
      });
    }
    return entityPromise;
  }

  detachHullUserFromService(user: HullIncomingUser) {
    return this.detachEntityFromService(user, this.upsertHullUser, this.client.asUser);
  }

  detachHullAccountFromService(account: HullIncomingAccount) {
    return this.detachEntityFromService(account, this.upsertHullAccount, this.client.asAccount);
  }

  upsertHullUser(user: HullIncomingUser) {

    const identity = _.cloneDeep(user.ident);
    const hullUserId = this.globalContext.get("hullUserId");
    if (hullUserId) {
      identity.id = hullUserId;
    }

    // Might think about adding some validation here or somewhere else
    // for now throwing errors, which I'm not sure is wrong
    // but it does make writing all the additional logic in the glue to validate more annoying
    // it should probably be done more automatically, or at least more easily
    const asUser = this.client.asUser(identity);

    let userPromise;

    // Not the tightest code in the world, but preserves the old behavior for now
    // which was to do a traits call no matter what
    if (user.events) {
      userPromise = Promise.all(user.events.map( event => {
        return asUser.track(event.eventName, event.properties, event.context);
      }));

      if (!_.isEmpty(user.attributes)) {
        userPromise = userPromise.then(() => {
          asUser.traits(user.attributes);
        });
      }
    } else {

      //need to call traits in all cases in case it's a new user
      // but still would need to validate identity values
      userPromise = asUser.traits(user.attributes);
    }

    if (!_.isEmpty(user.accountIdent)) {
      userPromise = userPromise.then(() => {
        return asUser.account(user.accountIdent).traits({})
      });
    }

    return userPromise;
  }

  outgoingSkip(messages: any) {

    let entities = messages;
    if (!Array.isArray(messages)) {
      entities = [messages];
    }
    _.forEach(entities, entity => {
      if (entity.user) {
        this.client.asUser(entity.user).logger.debug("outgoing.user.skip");
      } else if (entity.account) {
        this.client.asAccount(entity.account).logger.debug("outgoing.account.skip");
      } else {
        this.client.logger.info("outgoing.entity.skip", { data: entity });
      }
    });
  }

  upsertHullAccount(account: HullIncomingAccount) {
    return this.client.asAccount(account.ident).traits(account.attributes);
  }

  connectorSettingsUpdate(settings: any) {
    return this.helpers.settingsUpdate(settings);
  }

  getUser(claims: any) {
    return this.entities.users.get({ claims }).then((response) => {
      return _.get(response, "data[0]", []);
    });
  }

  getAccount(claims: any) {
    return this.entities.accounts.get({ claims }).then((response) => {
      return _.get(response, "data[0]", []);
    });
  }

  // TODO use entities.users.getSchema
  getUserAttributes() {
    return this.client.get("/users/schema").then((response) => {
      return response;
    });
  }

  // TODO use entities.accounts.getSchema
  getAccountAttributes() {
    return this.client.get("/accounts/schema").then((response) => {
      return response;
    });
  }

  // TODO use entities.users.getSegments
  getUserSegments() {
    return this.client.get("/users_segments").then((response) => {
      return response;
    });
  }

  // TODO use entities.accounts.getSegments
  getAccountSegments() {
    return this.client.get("/accounts_segments").then((response) => {
      return response;
    });
  }

  // TODO use entities.events.getSchema
  getUserEvents() {
    return this.client.get("/search/event/bootstrap").then((response) => {
      return response;
    });
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
    userDeletedInService: {
      method: "detachHullUserFromService",
      endpointType: "upsert",
      input: HullIncomingUser
    },
    accountDeletedInService: {
      method: "detachHullAccountFromService",
      endpointType: "upsert",
      input: HullIncomingAccount
    },
    asUserImport: {
      method: "upsertHullUser",
      endpointType: "upsert",
      type: "stream",
      input: HullIncomingUserImportApi
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
    getUserAttributes: {
      method: "getUserAttributes",
      endpointType: "byId",
      output: HullApiAttributeDefinition
    },
    getAccountAttributes: {
      method: "getAccountAttributes",
      endpointType: "byId",
      output: HullApiAttributeDefinition
    },
    getUserSegments: {
      method: "getUserSegments",
      endpointType: "byId",
      output: HullApiSegmentDefinition
    },
    getAccountSegments: {
      method: "getAccountSegments",
      endpointType: "byId",
      output: HullApiSegmentDefinition
    },
    getUserEvents: {
      method: "getUserEvents",
      endpointType: "byId",
      output: HullApiEventDefinition
    },
    getUser: {
      method: "getUser",
      endpointType: "byId",
      input: Object,
      output: HullIncomingUser
    },
    getAccount: {
      method: "getAccount",
      endpointType: "byId",
      input: Object,
      output: HullIncomingAccount
    },
    outgoingSkip: {
      method: "outgoingSkip",
      endpointType: "byId",
      input: HullIncomingUser,
      suppressLog: true
    }

  }
};

module.exports = {
  HullSdk,
  hullService
};
