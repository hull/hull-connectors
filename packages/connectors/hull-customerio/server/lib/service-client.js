/* @flow */
import type {
  IServiceClientOptions,
  IServiceCredentials,
  ILogger,
  IMetricsClient,
  ICustomerIoEvent,
  TCustomerIoCustomer
} from "./types";

const _ = require("lodash");
const superagent = require("superagent");
const SuperagentThrottle = require("superagent-throttle");
const prefixPlugin = require("superagent-prefix");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("hull/src/utils");

const throttlePool = {};

class ServiceClient {
  /**
   * Gets or sets the url prefix for all API calls.
   *
   * @type {string}
   * @memberof ServiceClient
   */
  urlPrefix: string;

  /**
   * Gets or sets the instance of superagent to use for API calls.
   *
   * @type {superagent}
   * @memberof ServiceClient
   */
  agent: superagent;

  /**
   * Gets or sets the credentials to authenticate with customer.io.
   *
   * @type {IServiceCredentials}
   * @memberof ServiceClient
   */
  auth: IServiceCredentials;

  /**
   * Gets or sets the logging client to use.
   *
   * @type {ILogger}
   * @memberof ServiceClient
   */
  logger: ILogger;

  /**
   * Gets or sets the client to report metrics.
   *
   * @type {IMetricsClient}
   * @memberof ServiceClient
   */
  metricsClient: IMetricsClient;

  /**
   * Creates an instance of ServiceClient.
   * @param {IServiceClientOptions} options The options to configure the client with.
   * @memberof ServiceClient
   */
  constructor(options: IServiceClientOptions) {
    this.urlPrefix = options.baseApiUrl;
    this.auth = options.credentials;
    this.logger = options.logger;
    this.metricsClient = options.metricsClient;

    throttlePool[this.auth.username] =
      throttlePool[this.auth.username] ||
      new SuperagentThrottle({
        rate: parseInt(process.env.THROTTLE_RATE, 10) || 30, // how many requests can be sent every `ratePer`
        ratePer: parseInt(process.env.THROTTLE_RATE_PER, 10) || 1000 // number of ms in which `rate` requests may be sent
      });

    const throttle = throttlePool[this.auth.username];

    this.agent = superagent
      .agent()
      .use(prefixPlugin(this.urlPrefix))
      .use(throttle.plugin())
      .use(superagentErrorPlugin({ timeout: 10000 }))
      .use(superagentUrlTemplatePlugin())
      .use(
        superagentInstrumentationPlugin({
          logger: this.logger,
          metric: this.metricsClient
        })
      )
      .set({ "Content-Type": "application/json" })
      .auth(this.auth.username, this.auth.password)
      .ok(res => res.status === 200); // we reject the promise for all non 200 responses
  }

  /**
   * Checks whether the provided credentials are valid or not.
   *
   * @returns {Promise<boolean>}
   * @memberof ServiceClient
   */
  checkValidCredentials(): Promise<boolean> {
    return this.agent
      .get("/auth")
      .then(() => {
        return true;
      })
      .catch(err => {
        if (_.get(err, "response.status") === 401) {
          return false;
        }
        throw err;
      });
  }

  /**
   * Creates or updates a customer.
   *
   * @param {TCustomerIoCustomer} customer The customer data.
   * @returns {Promise<TCustomerIoCustomer>} A promise which resolves the customer if operation succeeded.
   * @memberof ServiceClient
   * @see https://learn.customer.io/api/#apicustomers_update
   */
  updateCustomer(customer: TCustomerIoCustomer): Promise<TCustomerIoCustomer> {
    const attributes = _.omit(customer, "id");
    const id = encodeURIComponent(_.get(customer, "id"));
    const promises = [];
    if (_.keys(attributes).length <= 30) {
      promises.push(
        this.agent
          .put("/api/v1/customers/{{id}}")
          .tmplVar({ id })
          .send(attributes)
      );
    } else {
      const chunks = _.chunk(_.keys(attributes), 30);
      chunks.forEach(chunk => {
        const chunkedAttributes = _.pick(attributes, chunk);
        promises.push(
          this.agent
            .put("/api/v1/customers/{{id}}")
            .tmplVar({ id })
            .send(chunkedAttributes)
        );
      });
    }

    return Promise.all(promises).then(() => {
      return customer;
    });
  }

  /**
   * Deletes a customer.
   *
   * @param {string} id The identifier of the customer to delete.
   * @returns {Promise<string>} A promise which resolves to the identifier if operation succeeded.
   * @memberof ServiceClient
   * @see https://learn.customer.io/api/#apicustomers_delete
   */
  deleteCustomer(id: string): Promise<string> {
    const customerId = encodeURIComponent(id);
    return this.agent
      .delete("/api/v1/customers/{{customerId}}")
      .tmplVar({ customerId })
      .then(() => {
        return id;
      });
  }

  /**
   * Sends an event tracked for a particular user.
   *
   * @param {string} id The identifier of the user.
   * @param {ICustomerIoEvent} event The event data.
   * @returns {Promise<ICustomerIoEvent>} A promise which resolves to the event data if operation succeeded.
   * @memberof ServiceClient
   * @see https://learn.customer.io/api/#apievent_add
   * @see https://learn.customer.io/api/#apipageview_event
   */
  sendEvent(id: string, event: ICustomerIoEvent): Promise<ICustomerIoEvent> {
    const customerId = encodeURIComponent(id);
    return this.agent
      .post("/api/v1/customers/{{customerId}}/events")
      .tmplVar({ customerId })
      .send(event)
      .then(() => {
        return event;
      });
  }

  /**
   * Sends an anonymous event.
   *
   * @param {ICustomerIoEvent} event The event data.
   * @returns {Promise<ICustomerIoEvent>} A promise which resolves to the event data if operation succeeded.
   * @memberof ServiceClient
   * @see https://learn.customer.io/api/#apianonymous_event_add
   */
  sendAnonymousEvent(event: ICustomerIoEvent): Promise<ICustomerIoEvent> {
    return this.agent
      .post("/api/v1/customers/events")
      .send(event)
      .then(() => {
        return event;
      });
  }
}

module.exports = ServiceClient;
