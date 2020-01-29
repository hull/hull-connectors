// @flow

import type {
  HullClientInstanceConfig,
  HullEntityClaims,
  HullEntityName,
  HullAdditionalClaims
} from "../types";

import {
  filterEntityClaims,
  assertEntityClaimsValidity
} from "./filter-claims";

const _ = require("lodash");
const pkg = require("../../package.json");
const crypto = require("./crypto");

const GLOBALS = {
  prefix: "/api/v1",
  protocol: "https",
  timeout: 10000,
  retry: 5000
};

const VALID_OBJECT_ID = new RegExp("^[0-9a-fA-F]{24}$");
const VALID = {
  boolean(val) {
    return val === true || val === false;
  },
  object(val) {
    return _.isObject(val);
  },
  objectId(str) {
    return VALID_OBJECT_ID.test(str);
  },
  string(str) {
    return _.isString(str) && str.length > 0;
  },
  number(num) {
    return _.isNumber(num) && num > 0;
  },
  array(arr) {
    return _.isArray(arr);
  },
  transport(t) {
    const valid = t.type === "kafka" &&
      _.isString(t.topic) &&
      _.isArray(t.brokersList);
    if (t && !valid) throw new Error("Invalid Firehose transport configuration");
  }
};

const REQUIRED_PROPS = {
  id: VALID.objectId,
  organization: VALID.string
};

const VALID_PROPS = {
  ...REQUIRED_PROPS,
  secret: VALID.string,
  trackingOnly: VALID.boolean,
  prefix: VALID.string,
  domain: VALID.string,
  firehoseUrl: VALID.string,
  protocol: VALID.string,
  userClaim: VALID.object,
  accountClaim: VALID.object,
  subjectType: VALID.string,
  additionalClaims: VALID.object,
  accessToken: VALID.string,
  timeout: VALID.number,
  retry: VALID.number,
  hostSecret: VALID.string, // TODO: check if this is being used anywhere
  flushAt: VALID.number,
  flushAfter: VALID.number,
  connectorName: VALID.string,
  requestId: VALID.string,
  logs: VALID.array,
  firehoseEvents: VALID.array,
  firehoseTransport: VALID.transport
};

/**
 * Class containing configuration
 */
class Configuration {
  _state: HullClientInstanceConfig;

  constructor(config: HullClientInstanceConfig) {
    if (!_.isObject(config) || !_.size(config)) {
      throw new Error(
        "Configuration is invalid, it should be a non-empty object"
      );
    }

    if (config.userClaim !== undefined || config.accountClaim !== undefined) {
      assertEntityClaimsValidity("user", config.userClaim);
      assertEntityClaimsValidity("account", config.accountClaim);

      if (config.userClaim) {
        config.userClaim = filterEntityClaims("user", config.userClaim);
      }

      if (config.accountClaim) {
        config.accountClaim = filterEntityClaims(
          "account",
          config.accountClaim
        );
      }

      if (config.secret) {
        const accessToken = crypto.lookupToken(
          config,
          config.subjectType,
          {
            user: config.userClaim,
            account: config.accountClaim
          },
          config.additionalClaims
        );
        config = { ...config, accessToken };
      } else if (!config.trackingOnly) {
        throw new Error(`Client requires a secret unless trackingOnly is set to true`);
      }
    }

    this._state = { ...GLOBALS };

    _.each(REQUIRED_PROPS, (test, prop) => {
      if (!Object.prototype.hasOwnProperty.call(config, prop)) {
        const err = new Error(
          `Configuration is missing required property: ${prop}`
        );
        // $FlowFixMe
        err.status = 401;
        throw err;
      }
      if (!test(config[prop])) {
        const err = new Error(
          `${prop} property in Configuration is invalid: ${config[prop]}`
        );
        // $FlowFixMe
        err.status = 401;
        throw err;
      }
    });

    _.each(VALID_PROPS, (test, key) => {
      // @TODO check that this is actually desired as a strict comparison to make sure falsy values are still validated
      if (config[key] !== undefined) {
        this._state[key] = config[key];
      }
    });

    if (!this._state.domain && this._state.organization) {
      const [namespace, ...domain] = this._state.organization.split(".");
      this._state.namespace = namespace;
      this._state.domain = domain.join(".");
    }

    this._state.version = pkg.version;
  }

  set(key: string, value: $Values<HullClientInstanceConfig>): void {
    this._state[key] = value;
  }

  get(
    key?: string
  ):
    | string
    | number
    | Array<Object>
    | HullEntityName
    | HullEntityClaims
    | HullAdditionalClaims
    | HullClientInstanceConfig
    | void {
    if (key !== undefined) {
      return this._state[key];
    }
    return this.getAll();
  }

  getAll(): HullClientInstanceConfig {
    return JSON.parse(JSON.stringify(this._state));
  }
}

module.exports = Configuration;
