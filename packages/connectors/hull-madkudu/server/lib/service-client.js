/* @flow */
import type {
  TServiceClientOptions, THullMetrics, THullClientLogger, TMadkuduAnalyticsResult,
  TMadkuduAnalyticsGroup, TMadkuduAnalyticsIdentify, TMadkuduAnalyticsEvent, TMadkuduCompanyProfile,
  TMadkuduCompany, TMadkuduAnalyticsCallType
} from "./types";


const _ = require("lodash");
const Promise = require("bluebird");
const superagent = require("superagent");
const { superagentUrlTemplatePlugin, superagentInstrumentationPlugin } = require("hull/lib/utils");
const uid = require("crypto-token");
const validate = require("@segment/loosely-validate-event");

const SegmentError = require("./sync-agent/madkudu-error");

const MadkuduError = require("./sync-agent/madkudu-error");

class ServiceClient {
  /**
   * Gets or sets the client for logging metrics.
   *
   * @type {IMetricsClient}
   * @memberof ServiceClient
   */
  metricsClient: THullMetrics;

  /**
   * Gets or sets the superagent.
   *
   * @type {superagent}
   * @memberof ServiceClient
   */
  agent: superagent;

  /**
   * Gets or sets the logging client to use.
   *
   * @type {ILogger}
   * @memberof AnalyticsUtil
   */
  logger: THullClientLogger;

  madkuduApiUrl: string;

  madkuduAnalyticsUrl: string;

  /**
   * Creates an instance of ServiceClient.
   * @param {IServiceClientOptions} options The options for the client.
   * @memberof ServiceClient
   */
  constructor(options: TServiceClientOptions) {
    this.metricsClient = options.metricsClient;
    this.logger = options.logger;
    this.madkuduApiUrl = options.madkuduApiUrl;
    this.madkuduAnalyticsUrl = options.madkuduAnalyticsUrl;

    this.agent = superagent.agent()
      .use(superagentUrlTemplatePlugin())
      .use(superagentInstrumentationPlugin({ logger: options.logger, metric: this.metricsClient }))
      .set({ "Content-Type": "application/json" })
      .auth(options.apiKey)
      .ok(res => res.status === 200) // we reject the promise for all non 200 responses
      .timeout({ response: 10000 });
  }

  /**
   * Fetches data from the companies endpoint of the Madkudu API.
   *
   * @param {TMadkuduCompany} account The payload representing a Madkudu company.
   * @returns {Promise<IMadkuduApiResult>} The result of the API operation.
   * @memberof ServiceClient
   */
  fetchCompanyData(data: TMadkuduCompany): Promise<TMadkuduCompanyProfile> {
    this.metricsClient.increment("ship.outgoing.account", 1);

    return this.agent.post(`${this.madkuduApiUrl}/companies`).send(data).then((response) => {
      return response.body;
    })
      .catch((err) => {
        return Promise.reject((new MadkuduError("companies", err, _.get(err, "message", "An unknown error occurred when calling the companies endpoint."))));
      });
  }

  /**
   * Sends user data to Madkudu via segment.com.
   *
   * @param {THullUserUpdateMessage} message The user:update message.
   * @returns {Promise<Array<ISegmentApiResult>>} A promise that bundles all API operations.
   * @memberof ServiceClient
   */
  sendUserData(
    analyticsCallType: TMadkuduAnalyticsCallType,
    analyticsCallPayload: TMadkuduAnalyticsGroup | TMadkuduAnalyticsIdentify | TMadkuduAnalyticsEvent
  ): Promise<TMadkuduAnalyticsResult> {
    const body = this.buildAnalyticsCallBody(analyticsCallType, analyticsCallPayload);
    if (!body) {
      return Promise.resolve({
        result: "skip",
        type: analyticsCallType,
        message: "Empty payload received. No data will be sent to Madkudu"
      });
    }
    try {
      validate(body);
      return this.agent.post(this.madkuduAnalyticsUrl).send(body).then((response) => {
        return {
          result: "success",
          type: analyticsCallType,
          response: _.pick(response, "statusCode", "body")
        };
      }, (err) => {
        return Promise.reject(new SegmentError(analyticsCallType, err, _.get(err, "message", "Unknown API error, see InnerException for more details.")));
      });
    } catch (e) {
      this.logger.debug("segment.eventvalidation.error", { details: JSON.stringify(e) });
      return Promise.reject(new SegmentError(analyticsCallType, e, _.get(e, "message", "Unknown error, see InnerException for more details.")));
    }
  }

  /**
   * Utility function to build the payload to send to segment.com's
   * analytics client.
   *
   * @param {TSegmentAction} action The type of action.
   * @param {*} message The hull message payload.
   * @returns {*} The payload or null.
   * @memberof AnalyticsUtil
   */
  buildAnalyticsCallBody(type: TMadkuduAnalyticsCallType, message: Object): Object | null {
    if (!message) {
      return null;
    }

    return {
      timestamp: new Date(),
      messageId: `node-${uid(32)}`,
      ...message,
      type,
      library: {
        name: "hull-connector",
        version: "1.0.0"
      },
      _metadata: {
        ...message._metadata,
        nodeVersion: process.versions.node
      }
    };
  }
}

module.exports = ServiceClient;
