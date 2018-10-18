/* @flow */
import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullConnector,
  HullAccount,
  HullUser,
  HullUserClaims
} from "hull";

import type {
  OutreachOutboundMapping,
  OutreachConnectorSettings,
  OutreachList,
  // OutreachAccountRead,
  OutreachAccountReadData,
  OutreachProspectRead,
  OutreachProspectReadData,
  OutreachAccountUpdateEnvelope,
  OutreachProspectUpdateEnvelope,
  SuperAgentResponse
} from "./types";

const _ = require("lodash");
const { Client } = require("hull");
const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");

const MappingUtil = require("./helper/mapping-util");
const FilterUtil = require("./helper/filter-util");

const ServiceClient = require("./service-client");
const SharedMessages = require("./shared-messages");

class SyncAgent {
  /**
   * Gets or sets the client to log metrics.
   *
   * @type {THullMetrics}
   * @memberof SyncAgent
   */
  metricsClient: MetricAgent;

  /**
   * Gets or set the hull-node client.
   *
   * @type {THullClient}
   * @memberof SyncAgent
   */
  hullClient: Client;

  /**
   * Gets or sets the mapping utility.
   *
   * @type {MappingUtil}
   * @memberof SyncAgent
   */
  mappingUtil: MappingUtil;

  /**
   * Gets or sets the filter utility.
   *
   * @type {FilterUtil}
   * @memberof SyncAgent
   */
  filterUtil: FilterUtil;

  /**
   * Gets or sets the settings of the current connector instance.
   *
   * @type {OutreachConnectorSettings}
   * @memberof SyncAgent
   */
  normalizedPrivateSettings: OutreachConnectorSettings;

  /**
   * Gets or sets the client to communicate with
   * the Outreach.io API.
   *
   * @type {ServiceClient}
   * @memberof SyncAgent
   */
  serviceClient: ServiceClient;

  /**
   * Gets or sets the connector.
   *
   * @type {THullConnector}
   * @memberof SyncAgent
   */
  connector: HullConnector;

  /**
   * Id of the webhook that we created in outreach
   */
  webhookId: number;

  hullRequestContext: HullContext;

  /**
   * Creates an instance of SyncAgent.
   * @param {THullReqContext} reqContext The request context.
   * @memberof SyncAgent
   */
  constructor(reqContext: HullContext) {
    this.hullRequestContext = reqContext;
    // Initialize hull clients
    this.metricsClient = reqContext.metric;
    this.hullClient = reqContext.client;

    // Initialize the connector
    this.connector = reqContext.connector;

    this.webhookId = _.get(this.connector, "private_settings.webhook_id");

    // Initialize configuration from settings
    const loadedSettings: OutreachConnectorSettings = _.get(
      this.connector,
      "private_settings"
    );
    this.normalizedPrivateSettings = this.normalizeSettings(loadedSettings);
    this.filterUtil = new FilterUtil(this.normalizedPrivateSettings);
    this.mappingUtil = new MappingUtil(this.normalizedPrivateSettings);

    this.serviceClient = new ServiceClient(reqContext);
  }

  /**
   * Ensure that all settings have sensible defaults
   *
   * @param {OutreachConnectorSettings} settings The original settings.
   * @returns {OutreachConnectorSettings} The sanitized settings.
   * @memberof SyncAgent
   */
  normalizeSettings(
    settings: OutreachConnectorSettings
  ): OutreachConnectorSettings {
    const hullId = _.get(settings, "account_identifier_hull", "domain");
    const svcId = _.get(settings, "account_identifier_service", "url");

    const accountAttribsOut: Array<OutreachOutboundMapping> = _.get(
      settings,
      "account_attributes_outbound",
      []
    );
    const accountAttribsIn: Array<string> = _.get(
      settings,
      "account_attributes_inbound",
      []
    );
    // Ensure that the identifier for accounts is always present
    // TODO need to make sure I know what this is doing
    // This seems like something that should be done automatically
    // is this inserting domain and url automatically even if the customers didn't specify it?....
    // Causing domain to come in if it's specified as external id, might cause weird stuff to happen if we set the external id ever...
    // especially by accident if if got changed in hull and we resolved on something else..
    if (
      _.find(accountAttribsOut, {
        hull_field_name: hullId,
        outreach_field_name: svcId
      }) === undefined
    ) {
      accountAttribsOut.push({
        hull_field_name: hullId,
        outreach_field_name: svcId
      });
    }

    if (_.indexOf(accountAttribsIn, svcId) === -1) {
      accountAttribsIn.push(svcId);
    }

    // TODO this logic to clone these settings seems flawed
    // we're taking the original objects with a get and push above
    // but doing a deep clone here, but resetting them to be the original object
    const finalSettings: OutreachConnectorSettings = _.cloneDeep(settings);
    finalSettings.account_attributes_outbound = accountAttribsOut;
    finalSettings.account_attributes_inbound = accountAttribsIn;
    finalSettings.account_identifier_hull = hullId;
    finalSettings.account_identifier_service = svcId;

    return finalSettings;
  }

  /**
   * Fetches all accounts from Outreach.io
   *
   * @returns {Promise<any[]>} The list of accounts.
   * @memberof Agent
   */
  async fetchOutreachAccounts(): Promise<any> {
    await this.ensureWebhook();

    this.hullClient.logger.info("incoming.job.start");

    const outreachAccountsResponse: SuperAgentResponse<
      OutreachList<OutreachAccountReadData>
    > = await this.serviceClient.getOutreachAccounts();

    const outreachAccounts: OutreachList<OutreachAccountReadData> =
      outreachAccountsResponse.body;

    if (outreachAccounts.meta.count > 10000) {
      this.hullClient.logger.error("incoming.job.error", {
        jobName: "getAccounts",
        errors: SharedMessages.OPERATION_GREATER_THAN_10000_ENTITIES
      });
      return Promise.reject();
    }

    // TODO How nullpointer safe do we have to be when doing this?
    // does nodejs have different conventions around how to avoid nullpointers?
    return Promise.all(
      outreachAccounts.data.map(account => {
        return this.saveOutreachAccountToHull(account);
      })
    )
      .then(() => {
        this.hullClient.logger.info("incoming.job.success");
      })
      .catch(error => {
        this.hullClient.logger.error("incoming.job.error", { reason: error });
      });
  }

  saveOutreachAccountToHull(
    outreachAccount: OutreachAccountReadData
  ): Promise<*> {
    const hullAccountIdent = this.mappingUtil.mapOutreachAccountToHullAccountIdent(
      outreachAccount
    );
    const hullAccountAttributes = this.mappingUtil.mapOutreachAccountToHullAccountAttributes(
      outreachAccount
    );
    const asAccount = this.hullClient.asAccount(hullAccountIdent);

    return asAccount.traits(hullAccountAttributes).catch(error => {
      asAccount.logger.error("incoming.account.error", error);
    });
  }

  /**
   * Fetches all prospects from Outreach.io
   *
   * @returns {Promise<any[]>} The list of prospects.
   * @memberof Agent
   */
  async fetchOutreachProspects(): Promise<any> {
    await this.ensureWebhook();

    this.hullClient.logger.info("incoming.job.start");

    const outreachProspectsResponse: SuperAgentResponse<
      OutreachList<OutreachProspectReadData>
    > = await this.serviceClient.getOutreachProspects();

    // TODO How nullpointer safe do we have to be when doing this?
    // does nodejs have different conventions around how to avoid nullpointers?
    const outreachProspects: OutreachList<OutreachProspectReadData> =
      outreachProspectsResponse.body;

    if (outreachProspects.meta.count > 10000) {
      this.hullClient.logger.error("incoming.job.error", {
        jobName: "getUser",
        errors: SharedMessages.OPERATION_GREATER_THAN_10000_ENTITIES
      });
      return Promise.reject();
    }

    return Promise.all(
      outreachProspects.data.map(prospect => {
        const hullUserIdent = this.mappingUtil.mapOutreachProspectToHullUserIdent(
          prospect
        );
        return this.saveOutreachProspectToHull(hullUserIdent, prospect);
      })
    )
      .then(() => {
        this.hullClient.logger.info("incoming.job.success");
      })
      .catch(error => {
        this.hullClient.logger.error("incoming.job.error", { reason: error });
      });
  }

  /**
   * Processes the account:update messages and syncs data with outreach.io.
   *
   * @param {Array<THullAccountUpdateMessage>} messages The notification messages to process.
   * @returns {Promise<any>} A promise which wraps the async processing operation.
   * @memberof SyncAgent
   */
  async sendAccountMessages(
    messages: Array<HullAccountUpdateMessage>
  ): Promise<any> {
    await this.ensureWebhook();

    const deduplicatedMessages = this.filterUtil.deduplicateAccountUpdateMessages(
      messages
    );

    const envelopes = await Promise.all(
      deduplicatedMessages.map(message =>
        this.buildAccountUpdateEnvelope(message.account)
      )
    );

    const filterResults = this.filterUtil.filterAccounts(envelopes);

    filterResults.toSkip.forEach(envelope => {
      this.hullClient
        .asAccount(envelope.hullAccount)
        .logger.info("outgoing.account.skip", { reason: envelope.skipReason });
    });

    const updatedEnvelopes = await this.serviceClient.patchAccountEnvelopes(
      filterResults.toUpdate
    );

    await this.insertedOrUpdateAccounts(updatedEnvelopes);

    const insertedEnvelopes = await this.serviceClient.postAccountEnvelopes(
      filterResults.toInsert
    );

    await this.insertedOrUpdateAccounts(insertedEnvelopes);
  }

  insertedOrUpdateAccounts(
    accountUpdateEnvelopes: Array<OutreachAccountUpdateEnvelope>
  ) {
    return Promise.all(
      accountUpdateEnvelopes.map(async envelope => {
        try {
          if (envelope.error !== null) {
            throw new Error(envelope.error);
          }

          const outreachAccountReadData: OutreachAccountReadData =
            envelope.outreachAccountRead.data;

          await this.hullClient
            .asAccount(envelope.hullAccount)
            .traits(
              this.mappingUtil.mapOutreachAccountToHullAccountAttributes(
                outreachAccountReadData
              )
            );

          return this.hullClient
            .asAccount(envelope.hullAccount)
            .logger.info(
              "outgoing.account.success",
              envelope.outreachAccountWrite
            );
        } catch (error) {
          return this.hullClient
            .asAccount(envelope.hullAccount)
            .logger.info("outgoing.account.error", envelope.error);
        }
      })
    );
  }

  buildAccountUpdateEnvelope(
    hullAccount: HullAccount
  ): OutreachAccountUpdateEnvelope {
    const envelope: OutreachAccountUpdateEnvelope = {};
    envelope.hullAccount = _.cloneDeep(hullAccount);

    envelope.outreachAccountWrite = this.mappingUtil.mapHullAccountToOutreachAccount(
      envelope
    );
    return envelope;
  }

  /**
   * Processes the user:update messages and syncs data with outreach.io.
   *
   * @param {Array<THullUserUpdateMessage>} messages The notification messages to process.
   * @returns {Promise<any>} A promise which wraps the async processing operation.
   * @memberof SyncAgent
   */
  async sendUserMessages(messages: Array<HullUserUpdateMessage>): Promise<any> {
    await this.ensureWebhook();

    // Filter out any duplicates
    const deduplicatedMessages = this.filterUtil.deduplicateUserUpdateMessages(
      messages
    );

    // Build User Update Messages
    const envelopes = await Promise.all(
      deduplicatedMessages.map(message => this.buildUserUpdateEnvelope(message))
    );

    // Loop through and filter them into skip/update/insert paths
    const filterResults = this.filterUtil.filterUsers(envelopes);

    // Only thing to do is fire a logger for each skip
    filterResults.toSkip.forEach(envelope => {
      this.hullClient
        .asUser(envelope.hullUser)
        .logger.info("outgoing.user.skip", envelope.skipReason);
    });

    // USER UPDATES -> Ensure Accounts -> Update Users -> Fire callback
    const accountIdentifierHull = this.normalizedPrivateSettings
      .account_identifier_hull;
    const accountIdentifierService = this.normalizedPrivateSettings
      .account_identifier_service;

    await this.ensureOutreachAccounts(
      filterResults.toUpdate,
      accountIdentifierHull,
      accountIdentifierService
    );

    const updatedEnvelopes = await this.serviceClient.patchProspectEnvelopes(
      filterResults.toUpdate
    );

    await Promise.all(
      updatedEnvelopes.map(updatedEnvelope => {
        return this.handleHullUserUpdatedCallback(updatedEnvelope);
      })
    );

    // USER INSERTS -> Ensure Accounts -> Insert Users -> Fire callback
    await this.ensureOutreachAccounts(
      filterResults.toInsert,
      accountIdentifierHull,
      accountIdentifierService
    );

    const insertedEnvelopes = await this.serviceClient.postProspectEnvelopes(
      filterResults.toInsert
    );

    try {
      const promise = Promise.all(
        insertedEnvelopes.map(insertedEnvelope => {
          return this.handleHullUserUpdatedCallback(insertedEnvelope);
        })
      ).catch(error => {
        console.log(`something: ${error}`);
      });
      await promise;
    } catch (error) {
      console.log(`Please: ${error}`);
    }
    console.log("Finished!");
  }

  handleHullUserUpdatedCallback(
    prospectUpdateResult: OutreachProspectUpdateEnvelope
  ): Promise<*> {
    const hullUser: HullUser = prospectUpdateResult.hullUser;
    const readOutreachProspect: OutreachProspectRead =
      prospectUpdateResult.outreachProspectRead;
    try {
      // TODO error handling between account and prospect is different...
      // fix to the same
      if (_.isEmpty(readOutreachProspect)) {
        throw new Error(prospectUpdateResult.error || "Unknown error");
      }

      return this.saveOutreachProspectToHull(
        hullUser,
        readOutreachProspect.data
      );
    } catch (error) {
      return this.hullClient
        .asUser(hullUser)
        .logger.info("outgoing.user.error", error);
    }
  }

  saveOutreachProspectToHull(
    hullUserIdentity: HullUserClaims | HullUser,
    outreachProspect: OutreachProspectReadData
  ): Promise<*> {
    const hullUserAttributes = this.mappingUtil.mapOutreachProspectToHullUserAttributes(
      outreachProspect
    );

    // Need to associate with the user with the account here because they come in separately
    const hullAccountIdent = this.mappingUtil.mapOutreachProspectToHullAccountIdent(
      outreachProspect
    );

    const asUser = this.hullClient.asUser(hullUserIdentity);

    const userPromise = asUser.traits(hullUserAttributes);

    if (!_.isEmpty(hullAccountIdent)) {
      userPromise.then(() => {
        return asUser.account(hullAccountIdent).traits({});
      });
    }

    return userPromise.catch(error => {
      console.log(error);
    });
  }

  /**
   * Utility method to build the envelope for user:update messages.
   *
   * @param {THullUserUpdateMessage} message The notification message.
   * @returns {UserUpdateEnvelope} The envelope.
   * @memberof SyncAgent
   */
  buildUserUpdateEnvelope(
    message: HullUserUpdateMessage
  ): OutreachProspectUpdateEnvelope {
    const combinedUser = _.cloneDeep(message.user);
    combinedUser.account = _.cloneDeep(message.account);

    const envelope: OutreachProspectUpdateEnvelope = {};
    envelope.hullUser = combinedUser;

    envelope.outreachProspectWrite = this.mappingUtil.mapHullUserToOutreachProspect(
      envelope
    );

    return envelope;
  }

  /**
   * Ensure that the users we're about to push in have the corresponding hull account in outreach
   * @param {*} envelopes
   * @param {*} accountIdentifierHull
   * @param {*} accountIdentifierService
   */
  async ensureOutreachAccounts(
    envelopes: Array<OutreachProspectUpdateEnvelope>,
    accountIdentifierHull: string,
    accountIdentifierService: string
  ) {
    // returns an array of promises
    return Promise.all(
      envelopes.map(async envelope => {
        // checking empty at this point
        // must have a test which tests with a new account
        if (!_.isEmpty(envelope.hullUser.account)) {
          // find account in outreach if there is no outreach/id on the account
          // if there's no account, unhook it
          const accountIdentifierHullValue =
            envelope.hullUser.account[accountIdentifierHull];

          if (_.isEmpty(accountIdentifierHullValue)) {
            // TODO make sure to design error handling next... should this be resolve?
            return Promise.resolve();
          }

          const foundOutreachAccountsResponse: SuperAgentResponse<
            OutreachList<OutreachAccountReadData>
          > = await this.serviceClient.findOutreachAccounts(
            accountIdentifierService,
            accountIdentifierHullValue
          );

          const foundOutreachAccounts = foundOutreachAccountsResponse.body;

          if (foundOutreachAccounts.meta.count === 0) {
            // if account doesn't exist, create it...
            const accountEnvelope: OutreachAccountUpdateEnvelope = await this.buildAccountUpdateEnvelope(
              envelope.hullUser.account
            );

            if (
              _.isEmpty(
                accountEnvelope.outreachAccountWrite.data.attributes.name
              )
            ) {
              // TODO make sure to design error handling next... should this be resolve?
              // can't upload an account with no name
              // use account identifier if name is null?
              accountEnvelope.outreachAccountWrite.data.attributes.name = accountIdentifierHullValue;
            }

            const insertedEnvelopes = await this.serviceClient.postAccountEnvelopes(
              [accountEnvelope]
            );

            await this.insertedOrUpdateAccounts(insertedEnvelopes);

            // make sure we set the right value on the envelope for the user who we're about to update or insert
            _.set(
              envelope.outreachProspectWrite,
              "data.relationships.account.data",
              {
                type: "account",
                id: _.get(insertedEnvelopes[0], "outreachAccountRead.data.id")
              }
            );
          }
        }
      })
    );
  }

  async ensureWebhook() {
    // TODO also should check if webhook exists first too if going to create
    if (this.webhookId == null) {
      await this.serviceClient.createWebhook().then(response => {
        // Set webhook id so that if we ever call ensure ever again on this client, we won't create another
        // since we don't keep sync agent around, it doesn't really matter
        this.webhookId = response.body.data.id;
        return this.hullRequestContext.helpers.settingsUpdate({
          webhook_id: this.webhookId
        });
      });
    }
  }
}

module.exports = SyncAgent;
