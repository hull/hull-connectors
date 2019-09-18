/* @flow */
import type { THullReqContext, THullUserUpdateMessage, THullAccountUpdateMessage } from "hull";
import type {
  THullMetrics, THullClient, TServiceClientOptions,
  TAccountUpdateEnvelope, TFilterUtilOptions, TMadkuduConnectorPrivateSettings,
  TMadkuduCompanyProfile, TUserUpdateEnvelope
} from "./types";

const _ = require("lodash");
const Promise = require("bluebird");

const ServiceClient = require("./service-client");
const FilterUtil = require("./sync-agent/filter-util");
const MappingUtil = require("./sync-agent/mapping-util");
const { ACCOUNT_MAPPING, PERSON_MAPPING } = require("./sync-agent/clearbit-mappings");

const MADKUDU_ANALYTICS_URL: string = "https://data.madkudu.com/v1/hull";
const MADKUDU_PREDICTION_API_URL: string = "https://api.madkudu.com/v1";

class SyncAgent {
  /**
   * Gets or sets the client to log metrics.
   *
   * @type {THullMetrics}
   * @memberof SyncAgent
   */
  metric: THullMetrics;

  /**
   * Gets or set the hull-node client.
   *
   * @type {THullClient}
   * @memberof SyncAgent
   */
  hullClient: THullClient;

  /**
   * Gets or sets the service client for the Madkudu API.
   *
   * @type {ServiceClient}
   * @memberof SyncAgent
   */
  serviceClient: ServiceClient;

  /**
   * Gets or sets a value that indicates whether user data should be sent to Madkudu or not.
   *
   * @type {boolean}
   * @memberof SyncAgent
   */
  shouldSendUserData: boolean;

  /**
   * Gets or sets the list of synchronized accounts segments.
   *
   * @type {Array<string>}
   * @memberof SyncAgent
   */
  synchronizedAccountsSegments: Array<string>;

  synchronizedUsersSegments: Array<string>;

  /**
   * Gets or sets a value that indicates whether the connector has an API key.
   *
   * @type {boolean}
   * @memberof SyncAgent
   */
  hasApiKey: boolean;

  /**
   * Gets or sets the mapping utility to use.
   *
   * @type {MappingUtil}
   * @memberof SyncAgent
   */
  mappingUtil: MappingUtil;

  /**
   * Gets or sets the filter utility to use.
   *
   * @type {FilterUtil}
   * @memberof SyncAgent
   */
  filterUtil: FilterUtil;

  isBatch: boolean;

  constructor(reqContext: THullReqContext) {
    // Initialize hull clients
    this.metric = reqContext.metric;
    this.hullClient = reqContext.client;

    // Make settings type safe
    const privateSettings: TMadkuduConnectorPrivateSettings = _.get(reqContext, "ship.private_settings");

    this.synchronizedAccountsSegments = privateSettings.synchronized_account_segments || [];
    this.synchronizedUsersSegments = privateSettings.synchronized_user_segments || [];
    this.hasApiKey = (_.get(privateSettings, "api_key", null) !== null);

    // Initialize madkudu service client
    const clientOptions: TServiceClientOptions = {
      logger: this.hullClient.logger,
      metricsClient: this.metric,
      hullClient: this.hullClient,
      madkuduApiUrl: MADKUDU_PREDICTION_API_URL,
      madkuduAnalyticsUrl: MADKUDU_ANALYTICS_URL,
      apiKey: _.get(privateSettings, "api_key", null)
    };
    this.serviceClient = new ServiceClient(clientOptions);

    // Initialize the mapping utility.
    this.mappingUtil = new MappingUtil({ company: ACCOUNT_MAPPING, person: PERSON_MAPPING });

    // Initiliaze the filter utility.
    const filterUtilOpts: TFilterUtilOptions = {
      synchronizedAccountsSegments: this.synchronizedAccountsSegments,
      segmentAccountPropertyName: "account_segments",
      synchronizedUsersSegments: this.synchronizedUsersSegments
    };
    this.filterUtil = new FilterUtil(filterUtilOpts);

    this.isBatch = this.isBatchRequest(reqContext);
  }

  isBatchRequest(ctx: THullReqContext): boolean {
    return ctx.options !== undefined
      && ctx.options.format !== undefined
      && ctx.options.url !== undefined
      && ctx.options.object_type !== undefined;
  }

  /**
   * Processes all user:update notifications.
   *
   * @param {Array<THullUserUpdateMessage>} messages The list of notification messages.
   * @param {boolean} [isBatch=false] True if batch operation; otherwise False. Default is False.
   * @returns {Promise<any>} A promise which contains all operation results.
   * @memberof SyncAgent
   */
  sendUserUpdateMessages(messages: Array<THullUserUpdateMessage>): Promise<any> {
    if (!this.hasApiKey) {
      // We don't need a log line here, it's already in the status that we don't send any data
      // or that the entire connector is disabled.
      return Promise.resolve();
    }

    const envelopes: Array<TUserUpdateEnvelope> = messages.map((message) => this.buildUserUpdateEnvelope(message));

    const filteredEnvelopes = this.filterUtil.filterUserUpdateEnvelopes(envelopes, this.isBatch);

    filteredEnvelopes.toSkip.forEach((envelope) => {
      const userIdent = this.mappingUtil.extractUserIdentifier(envelope.message.user);
      const hullClientUser = this.hullClient.asUser(userIdent);
      hullClientUser.logger.info("outgoing.user.skip", { reason: envelope.skipReason });
    });

    const promises = filteredEnvelopes.toInsert.map(async (envelope) => {
      // $FlowFixMe
      const hullClntUser = this.hullClient.asUser(envelope.message.user);
      hullClntUser.logger.debug("outgoing.user.start", { operation: "sendUserData", eventsCount: envelope.message.events.length });

      try {
        const apiResults = await Promise.mapSeries(envelope.analyticsCalls, ({ analyticsCallType, analyticsCallPayload }) => {
          return this.serviceClient.sendUserData(analyticsCallType, analyticsCallPayload);
        }, { concurrency: 10 });
        return hullClntUser.logger.info("outgoing.user.success", { details: apiResults });
      } catch (err) {
        // TBD: Do we want to retry and fail?
        hullClntUser.logger.error("outgoing.user.error", { message: _.get(err, "message", "Unknown error when sending user data.") });
      }
      return Promise.resolve();
    });

    return Promise.all(promises);
  }

  /**
   * Processes all account:update notifications.
   *
   * @param {Array<THullAccountUpdateMessage>} messages The list of notification messages.
   * @param {boolean} [isBatch=false] True if batch operation; otherwise False. Default is False.
   * @returns {Promise<any>} A promise which contains all operation results.
   * @memberof SyncAgent
   */
  sendAccountUpdateMessages(messages: Array<THullAccountUpdateMessage>): Promise<any> {
    if (!this.hasApiKey) {
      // We don't need a log line here, it's already in the status that we don't send any data
      // or that the entire connector is disabled.
      return Promise.resolve();
    }

    const envelopes = messages.map((message) => this.buildAccountUpdateEnvelope(message));

    const filteredEnvelopes = this.filterUtil.filterAccountUpdateEnvelopes(envelopes, this.isBatch);
    filteredEnvelopes.toSkip.forEach((envelope: TAccountUpdateEnvelope) => {
      const hullClntAccount = this.hullClient.asAccount(this.mappingUtil.extractAccountIdentifier(envelope.message.account));
      hullClntAccount.logger.info("outgoing.account.skip", { reason: envelope.skipReason });
    });

    const promises: Array<Promise> = filteredEnvelopes.toInsert.map(async (envelope: TAccountUpdateEnvelope) => {
      const hullClntAccount = this.hullClient.asAccount(this.mappingUtil.extractAccountIdentifier(envelope.message.account));
      hullClntAccount.logger.debug("outgoing.account.start", { operation: "fetchCompanyData" });

      try {
        const apiResult: TMadkuduCompanyProfile = await this.serviceClient.fetchCompanyData(envelope.company);
        const acctTraits = this.mappingUtil.mapMadkuduCompanyToTraits(apiResult);
        if (!acctTraits) {
          hullClntAccount.logger.error("outgoing.account.error", { message: "Failed to process Madkudu response", data: apiResult });
          return Promise.resolve();
        }

        await hullClntAccount.traits(acctTraits, { source: "Madkudu" }).then(() => {
          hullClntAccount.logger.info("outgoing.account.success", { data: apiResult });
        });
      } catch (err) {
        // TBD: Do we want to retry and fail?
        hullClntAccount.logger.error("outgoing.account.error", { message: _.get(err, "message", "Unknown error when fetching company data from Madkudu.") });
      }

      return Promise.resolve();
    });
    return Promise.all(promises);
  }

  buildUserUpdateEnvelope(message: THullUserUpdateMessage): TUserUpdateEnvelope {
    const analyticsCalls = [];
    // Always issue an identify call for the user
    analyticsCalls.push({
      analyticsCallType: "identify",
      analyticsCallPayload: this.mappingUtil.mapToIdentify(message.user)
    });

    message.events.map((event) => {
      const eventType = event.event === "screen" || event.event === "page"
        ? event.event
        : "track";
      return analyticsCalls.push({
        analyticsCallType: eventType,
        analyticsCallPayload: this.mappingUtil.mapToEvent(eventType, message.user, event)
      });
    });
    const mappedPayload = this.mappingUtil.mapToGroup(message.user, message.account);
    if (mappedPayload) {
      analyticsCalls.push({
        analyticsCallType: "group",
        analyticsCallPayload: mappedPayload
      });
    }
    return { message, analyticsCalls };
  }

  buildAccountUpdateEnvelope(message: THullAccountUpdateMessage): TAccountUpdateEnvelope {
    return {
      message,
      company: this.mappingUtil.mapToMadkuduCompany(this.hullClient.utils.traits.group(message.account))
    };
  }
}

module.exports = SyncAgent;
