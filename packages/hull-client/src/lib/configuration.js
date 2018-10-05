// @flow
import type {
  HullClientConfiguration,
  HullEntityClaims,
  HullEntityType,
  HullAuxiliaryClaims
} from "../types";

const _ = require("lodash");
const pkg = require("../../package.json");
const crypto = require("./crypto");

const GLOBALS = {
  prefix: "/api/v1",
  protocol: "https"
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
  }
};

const REQUIRED_PROPS = {
  id: VALID.objectId,
  secret: VALID.string,
  organization: VALID.string
};

const VALID_PROPS = {
  ...REQUIRED_PROPS,
  prefix: VALID.string,
  domain: VALID.string,
  firehoseUrl: VALID.string,
  protocol: VALID.string,
  userClaim: VALID.object,
  accountClaim: VALID.object,
  subjectType: VALID.string,
  additionalClaims: VALID.object,
  accessToken: VALID.string,
  hostSecret: VALID.string, // TODO: check if this is being used anywhere
  flushAt: VALID.number,
  flushAfter: VALID.number,
  connectorName: VALID.string,
  requestId: VALID.string,
  logs: VALID.array,
  firehoseEvents: VALID.array
};

/**
 * All valid user claims, used for validation and filterind .asUser calls
 * @type {Array}
 */
const USER_CLAIMS: Array<string> = [
  "id",
  "email",
  "external_id",
  "anonymous_id"
];

/**
 * All valid accounts claims, used for validation and filtering .asAccount calls
 * @type {Array}
 */
const ACCOUNT_CLAIMS: Array<string> = [
  "id",
  "external_id",
  "domain",
  "anonymous_id"
];

/**
 * Class containing configuration
 */
class Configuration {
  _state: HullClientConfiguration;

  constructor(config: HullClientConfiguration) {
    if (!_.isObject(config) || !_.size(config)) {
      throw new Error(
        "Configuration is invalid, it should be a non-empty object"
      );
    }

    if (config.userClaim !== undefined || config.accountClaim !== undefined) {
      this.assertEntityClaimsValidity("user", config.userClaim);
      this.assertEntityClaimsValidity("account", config.accountClaim);

      if (config.userClaim) {
        config.userClaim = this.filterEntityClaims("user", config.userClaim);
      }

      if (config.accountClaim) {
        config.accountClaim = this.filterEntityClaims(
          "account",
          config.accountClaim
        );
      }

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
    }

    this._state = { ...GLOBALS };

    _.each(REQUIRED_PROPS, (test, prop) => {
      if (!Object.prototype.hasOwnProperty.call(config, prop)) {
        throw new Error(`Configuration is missing required property: ${prop}`);
      }
      if (!test(config[prop])) {
        throw new Error(
          `${prop} property in Configuration is invalid: ${config[prop]}`
        );
      }
    });

    _.each(VALID_PROPS, (test, key) => {
      if (config[key]) {
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

  /**
   * make sure that provided "identity claim" is valid
   * @param  {string} type          "user" or "account"
   * @param  {string|Object} object identity claim
   * claim is an object
   * @throws Error
   */
  assertEntityClaimsValidity(
    type: HullEntityType,
    object: void | string | HullEntityClaims
  ): void {
    const claimsToCheck = type === "user" ? USER_CLAIMS : ACCOUNT_CLAIMS;
    if (!_.isEmpty(object)) {
      if (typeof object === "string") {
        if (!object) {
          throw new Error(`Missing ${type} ID`);
        }
      } else if (
        typeof object !== "object" ||
        _.intersection(_.keys(object), claimsToCheck).length === 0
      ) {
        throw new Error(
          `You need to pass an ${type} hash with an ${claimsToCheck.join(
            ", "
          )} field`
        );
      }
    }
  }

  filterEntityClaims(
    type: HullEntityType,
    object: void | string | HullEntityClaims
  ): * {
    const claimsToFilter = type === "user" ? USER_CLAIMS : ACCOUNT_CLAIMS;
    return typeof object === "string" ? object : _.pick(object, claimsToFilter);
  }

  set(key: string, value: $Values<HullClientConfiguration>): void {
    this._state[key] = value;
  }

  get(
    key?: string
  ):
    | string
    | number
    | Array<Object>
    | HullEntityType
    | HullEntityClaims
    | HullAuxiliaryClaims
    | HullClientConfiguration
    | void {
    if (key) {
      return this._state[key];
    }
    return JSON.parse(JSON.stringify(this._state));
  }

  getAll(): HullClientConfiguration {
    return JSON.parse(JSON.stringify(this._state));
  }
}

module.exports = Configuration;
