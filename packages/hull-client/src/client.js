// @flow

import type {
  HullClientConfiguration,
  HullEntityAttributes,
  HullUserEventName,
  HullUserEventProperties,
  HullUserEventContext,
  HullAccountClaims,
  HullUserClaims,
  HullAuxiliaryClaims,
  HullEntityClaims,
  HullClientLogger,
  HullClientUtils,
  HullClientStaticLogger
} from "./types";

const _ = require("lodash");
const winston = require("winston");
const uuidV4 = require("uuid/v4");

const Configuration = require("./lib/configuration");
const restAPI = require("./lib/rest-api");
const crypto = require("./lib/crypto");
const Firehose = require("./lib/firehose");

const traitsUtils = require("./utils/traits");
const settingsUtils = require("./utils/settings");
const propertiesUtils = require("./utils/properties");

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: "info",
      json: true,
      stringify: true
    })
  ]
});

/**
 * HullClient instance constructor - creates new instance to perform API calls, issue traits/track calls and log information
 *
 * @public
 * @param {Object}  config configuration object
 * @param {string}  config.id Connector ID - required
 * @param {string}  config.secret Connector Secret - required
 * @param {string}  config.organization Hull organization - required
 * @param {string}  [config.requestId] additional parameter which will be added to logs context, it can be HTTP request unique id when you init HullClient and you want to group log lines by the request (it can be a job id etc.)
 * @param {string}  [config.connectorName] additional parameter which will be added to logs context, it's used to track connector name in logs
 * @param {boolean} [config.captureLogs] an optional param to enable capturing logs, when enabled logs won't be sent to stdout/stderr and `logs` array would be initiated, which you can access via hullClient.configuration().logs
 * @param {boolean} [config.captureFirehoseEvents] an option param to enable capturing firehose events, when enabled firehose events won't be sent to firehose endpoint and `firehoseEvents` array woyld be initiated, which you can access via hullClient.configuration().firehoseEvents
 * @param {string}  [config.firehoseUrl=] The url track/traits calls should be sent, available only for testing purposes
 * @param {string}  [config.protocol=https] protocol which will be appended to organization url, override for testing only
 * @param {string}  [config.prefix=/api/v1] prefix of Hull REST API, override for testing only
 * @param {Array}   [config.logs] an optional array to capture all logs entries, you can provide your own array or use `captureLogs` to initiate empty one
 * @param {Array}   [config.firehoseEvents] an optional array to capture all firehose events, you can provide your own array or use `captureFirehoseEvents` to initiate empty one
 *
 * @example
 * const HullClient = require("hull-client");
 * const hullClient = new HullClient({
 *   id: "HULL_ID",
 *   secret: "HULL_SECRET",
 *   organization: "HULL_ORGANIZATION_DOMAIN"
 * });
 */
/**
 * Following methods allows to perform api calls against Hull REST API.
 * Their are available on base `HullClient` and all scoped classes.
 *
 * @namespace Api
 * @public
 */
class HullClient {
  config: HullClientConfiguration;

  clientConfig: Configuration;

  logger: HullClientLogger;

  utils: HullClientUtils;

  requestId: string | void;

  batch: Firehose;

  static logger: HullClientStaticLogger;

  constructor(config: HullClientConfiguration) {
    if (config.captureLogs === true) {
      config.logs = config.logs || [];
    }
    if (config.captureFirehoseEvents === true) {
      config.firehoseEvents = config.firehoseEvents || [];
    }
    this.config = config;
    this.clientConfig = new Configuration(config);

    const conf = this.configuration() || {};
    const ctxKeys = _.pick(conf, [
      "organization",
      "id",
      "connectorName",
      "subjectType",
      "requestId"
    ]);
    const ctxe = _.mapKeys(ctxKeys, (value, key) => _.snakeCase(key));

    ["user", "account"].forEach(k => {
      const claim = conf[`${k}Claim`];
      if (_.isString(claim)) {
        ctxe[`${k}_id`] = claim;
      } else if (_.isObject(claim)) {
        _.each(claim, (value, key) => {
          const ctxKey = _.snakeCase(`${k}_${key.toLowerCase()}`);
          if (value) ctxe[ctxKey] = value.toString();
        });
      }
    });

    if (this.clientConfig.get("firehoseEvents")) {
      const firehoseEventsArray = this.clientConfig.get("firehoseEvents");
      if (!Array.isArray(firehoseEventsArray)) {
        throw new Error("Configuration `firehoseEventsArray` must be an Array");
      }
      this.batch = data => {
        firehoseEventsArray.push({ context: ctxe, data });
        return Promise.resolve();
      };
    } else {
      this.batch = Firehose.getInstance(
        this.clientConfig.get(),
        (params, batcher) => {
          const protocol = this.clientConfig._state.protocol || "";
          const domain = this.clientConfig._state.domain || "";
          const firehoseUrl =
            this.clientConfig._state.firehoseUrl ||
            `${protocol}://firehose.${domain}`;
          return restAPI(this, batcher.config, firehoseUrl, "post", params, {
            timeout: process.env.BATCH_TIMEOUT || 10000,
            retry: process.env.BATCH_RETRY || 5000
          });
        }
      );
    }

    /**
     * The following methods are helper utilities. They are available under `utils` property
     *
     * @namespace Utils
     * @public
     */
    this.utils = {
      traits: traitsUtils,
      properties: {
        get: propertiesUtils.get.bind(this)
      },
      settings: {
        update: settingsUtils.update.bind(this)
      }
    };

    const logFactory = level => (message: string, data: Object | null | void) =>
      logger[level](message, { context: ctxe, data });
    this.logger = {
      log: logFactory("info"),
      silly: logFactory("silly"),
      debug: logFactory("debug"),
      verbose: logFactory("verbose"),
      info: logFactory("info"),
      warn: logFactory("warn"),
      error: logFactory("error")
    };

    this.requestId = conf.requestId;

    if (this.clientConfig.get("logs")) {
      const logsArray = this.clientConfig.get("logs");
      if (!Array.isArray(logsArray)) {
        throw new Error("Configuration `logs` must be an Array");
      }
      if (logger.transports.console) {
        logger.remove("console");
        logger.add(winston.transports.Memory, {
          level: "debug",
          json: true,
          stringify: input => input
        });
      }
      logger.removeAllListeners();
      logger.on("logged", (level, message, payload) => {
        logsArray.push({
          message,
          level,
          data: payload.data,
          context: payload.context,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  /**
   * Returns the global configuration object.
   *
   * @public
   * @return {Object} current `HullClient` configuration parameters
   * @example
   * const hullClient = new HullClient({});
   * hullClient.configuration() == {
   *   prefix: "/api/v1",
   *   domain: "hullapp.io",
   *   protocol: "https",
   *   id: "58765f7de3aa14001999",
   *   secret: "12347asc855041674dc961af50fc1",
   *   organization: "fa4321.hullapp.io",
   *   version: "0.13.10"
   * };
   */
  configuration(): HullClientConfiguration {
    return this.clientConfig.getAll();
  }

  /**
   * Performs a HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {string} method
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  api(url: string, method: string, params: Object, options: Object = {}) {
    return restAPI(this, this.clientConfig, url, method, params, options);
  }

  /**
   * Performs a GET HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params={}]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  get(url: string, params: Object = {}, options: Object = {}) {
    return restAPI(this, this.clientConfig, url, "get", params, options);
  }

  /**
   * Performs a POST HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params={}]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  post(url: string, params: Object = {}, options: Object = {}) {
    return restAPI(this, this.clientConfig, url, "post", params, options);
  }

  /**
   * Performs a DELETE HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params={}]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  del(url: string, params: Object = {}, options: Object = {}) {
    return restAPI(this, this.clientConfig, url, "del", params, options);
  }

  /**
   * Performs a PUT HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params={}]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  put(url: string, params: Object = {}, options: Object = {}) {
    return restAPI(this, this.clientConfig, url, "put", params, options);
  }

  /**
   * Takes User Claims (link to User Identity docs) and returnes `HullClient` instance scoped to this User.
   * This makes {@link #traits} and {@link #track} methods available.
   *
   * @public
   * @param {Object} userClaim
   * @param {Object}  [additionalClaims={}]
   * @param {boolean} [additionalClaims.create=true] marks if the user should be lazily created if not found
   * @param {Array}   [additionalClaims.scopes=[]] adds scopes claim to the JWT to impersonate a User with admin rights
   * @param {string}  [additionalClaims.active=false] marks the user as _active_ meaning a reduced latency at the expense of scalability. Don't use for high volume updates
   *
   * @throws {Error} if no valid claims are passed
   * @return {UserScopedHullClient}
   */
  asUser(
    userClaim: string | HullUserClaims,
    additionalClaims: HullAuxiliaryClaims = Object.freeze({})
  ) {
    if (!userClaim) {
      throw new Error("User Claims was not defined when calling hull.asUser()");
    }
    return new UserScopedHullClient({
      ...this.config,
      subjectType: "user",
      userClaim,
      additionalClaims
    });
  }

  /**
   * Takes Account Claims (link to User Identity docs) and returnes `HullClient` instance scoped to this Account.
   * This makes {@link #traits} method available.
   *
   * @public
   * @param  {Object} accountClaim
   * @param  {Object} additionalClaims
   * @throws {Error} If no valid claims are passed
   * @return {AccountScopedHullClient} instance scoped to account claims
   */
  asAccount(
    accountClaim: string | HullAccountClaims,
    additionalClaims: HullAuxiliaryClaims = Object.freeze({})
  ) {
    if (!accountClaim) {
      throw new Error(
        "Account Claims was not defined when calling hull.asAccount()"
      );
    }
    return new AccountScopedHullClient({
      ...this.config,
      subjectType: "account",
      accountClaim,
      additionalClaims
    });
  }
}

/**
 * The following methods are available when `HullClient` instance is scoped to an user or an account.
 * How to get scoped client? Use `asUser` or `asAccount` methods.
 * The `EntityScopedHullClient` is never directly returned by the HullClient but is a base class for UserScopedHullClient and AccountScopedHullClient classes.
 *
 * @public
 * @example
 * const hullClient = new HullClient({ id, secret, organization });
 * const scopedHullClient = hullClient.asUser({ email: "foo@bar.com "});
 * scopedHullClient.traits({ new_attribute: "new_value" });
 */
class EntityScopedHullClient extends HullClient {
  /**
   * Used for [Bring your own users](http://hull.io/docs/users/byou).
   * Creates a signed string for the user passed in hash. `userHash` needs an `email` field.
   * [You can then pass this client-side to Hull.js](http://www.hull.io/docs/users/byou) to authenticate users client-side and cross-domain
   *
   * @public
   * @param  {Object} claims additionalClaims
   * @return {string}        token
   * @example
   * hullClient.asUser({ email: "xxx@example.com", external_id: "1234" }).token(optionalClaims);
   * hullClient.asAccount({ domain: "example.com", external_id: "1234" }).token(optionalClaims);
   */
  token(claims: HullEntityClaims) {
    const subjectType = this.clientConfig._state.subjectType || "";
    const claim =
      subjectType === "account"
        ? this.clientConfig._state.accountClaim
        : this.clientConfig._state.userClaim;

    return crypto.lookupToken(
      this.clientConfig.get(),
      subjectType,
      { [subjectType]: claim },
      claims
    );
  }

  /**
   * Saves attributes on the user or account. Only available on User or Account scoped `HullClient` instance (see {@link #asuser} and {@link #asaccount}).
   *
   * @public
   * @param  {Object} traits            object with new attributes, it's always flat object, without nested subobjects
   * @return {Promise}
   */
  traits(traits: HullEntityAttributes): Promise<*> {
    const body = { ...traits };
    return this.batch({ type: "traits", body, requestId: this.requestId });
  }
}

/**
 * The following methods are available when `HullClient` instance is scoped to an user only
 * How to get scoped client? Use `asUser` method
 *
 * @public
 * @example
 * const hullClient = new HullClient({ id, secret, organization });
 * const scopedHullClient = hullClient.asUser({ email: "foo@bar.com "});
 * scopedHullClient.traits({ new_attribute: "new_value" });
 */
class UserScopedHullClient extends EntityScopedHullClient {
  /**
   * Available only for User scoped `HullClient` instance (see {@link #asuser}).
   * Returns `HullClient` instance scoped to both User and Account, but all traits/track call would be performed on the User, who will be also linked to the Account.
   *
   * @public
   * @param  {Object} accountClaim [description]
   * @return {HullClient} HullClient scoped to a User and linked to an Account
   */
  account(accountClaim: HullAccountClaims = Object.freeze({})) {
    return new AccountScopedHullClient({
      ...this.config,
      subjectType: "account",
      accountClaim
    });
  }

  /**
   * Issues an `alias` event on user?
   * @todo
   * @public
   * @param  {Object} body
   * @return {Promise}
   */
  alias(body: Object) {
    return this.batch({
      type: "alias",
      requestId: this.requestId,
      body
    });
  }

  /**
   * Stores events on user. Only available on User scoped `HullClient` instance (see {@link #asuser}).
   *
   * @public
   * @param  {string} event      event name
   * @param  {Object} properties additional information about event, this is a one-level JSON object
   * @param  {Object} [context={}] The `context` object lets you define event meta-data. Everything is optional
   * @param  {string} [context.source]     Defines a namespace, such as `zendesk`, `mailchimp`, `stripe`
   * @param  {string} [context.type]       Define a event type, such as `mail`, `ticket`, `payment`
   * @param  {string} [context.created_at] Define an event date. defaults to `now()`
   * @param  {string} [context.event_id]   Define a way to de-duplicate events. If you pass events with the same unique `event_id`, they will overwrite the previous one.
   * @param  {string} [context.ip]         Define the Event's IP. Set to `null` if you're storing a server call, otherwise, geoIP will locate this event.
   * @param  {string} [context.referer]    Define the Referer. `null` for server calls.
   * @return {Promise}
   */
  track(
    event: HullUserEventName,
    properties: HullUserEventProperties = {},
    context: HullUserEventContext = {}
  ): Promise<*> {
    _.defaults(context, {
      event_id: uuidV4()
    });
    return this.batch({
      type: "track",
      requestId: this.requestId,
      body: {
        ...{}, // workaround @see https://github.com/facebook/flow/issues/1805#issuecomment-238650551
        ip: null,
        url: null,
        referer: null,
        ...context,
        properties,
        event
      }
    });
  }
}

/**
 * This is a class returned when we scope client to account. It provides `token` and `traits` methods.
 *
 * @public
 * @example
 * const hullClient = new HullClient({ id, secret, organization });
 * const scopedHullClient = hullClient.asAccount({ domain: "bar.com "});
 * scopedHullClient.traits({ new_attribute: "new_value" });
 */
class AccountScopedHullClient extends EntityScopedHullClient {}

HullClient.logger = logger;

module.exports = HullClient;
