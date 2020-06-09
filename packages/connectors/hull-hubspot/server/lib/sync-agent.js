// @flow
import type {
  HullUserUpdateMessage,
  HullConnector,
  HullContext,
  HullAccountSegment,
  HullUserSegment,
  HullAccountUpdateMessage
} from "hull";

import type {
  HubspotAccountUpdateMessageEnvelope,
  HubspotUserUpdateMessageEnvelope,
  HubspotReadContact,
  HubspotReadCompany,
  ServiceType,
  HubspotPropertyGroup
} from "../types";

const _ = require("lodash");

const { pipeStreamToPromise } = require("hull/src/utils");
const {
  toSendMessage
} = require("hull-connector-framework/src/purplefusion/utils");
const defaultIncomingGroupMapping = require("./sync-agent/mapping/default-incoming-group");
const defaultOutgoingGroupMapping = require("./sync-agent/mapping/default-outgoing-group");

const HubspotClient = require("./hubspot-client");
const HubspotPropertyUtil = require("./sync-agent/hubspot-property-util");
const MappingUtil = require("./sync-agent/mapping-util");
const ProgressUtil = require("./sync-agent/progress-util");
const FilterUtil = require("./sync-agent/filter-util");

class SyncAgent {
  hubspotClient: HubspotClient;

  contactPropertyUtil: HubspotPropertyUtil;

  companyPropertyUtil: HubspotPropertyUtil;

  mappingUtil: MappingUtil;

  progressUtil: ProgressUtil;

  filterUtil: FilterUtil;

  connector: HullConnector;

  hullClient: Object;

  metric: Object;

  helpers: $PropertyType<HullContext, "helpers">;

  logger: Object;

  usersSegments: Array<HullUserSegment>;

  accountsSegments: Array<HullAccountSegment>;

  cache: Object;

  isBatch: boolean;

  fetchAccounts: boolean;

  ctx: HullContext;

  constructor(ctx: HullContext) {
    const {
      client,
      cache,
      connector,
      metric,
      helpers,
      usersSegments,
      accountsSegments
    } = ctx;
    this.hullClient = client;
    this.connector = connector;
    this.metric = metric;
    this.helpers = helpers;
    this.logger = client.logger;
    this.usersSegments = usersSegments;
    this.accountsSegments = accountsSegments;
    this.cache = cache;

    this.hubspotClient = new HubspotClient(ctx);
    this.progressUtil = new ProgressUtil(ctx);
    this.filterUtil = new FilterUtil(ctx);
    this.fetchAccounts = ctx.connector.private_settings.handle_accounts;
    this.ctx = ctx;
  }

  isInitialized(): boolean {
    return (
      this.contactPropertyUtil instanceof HubspotPropertyUtil &&
      this.companyPropertyUtil instanceof HubspotPropertyUtil &&
      this.mappingUtil instanceof MappingUtil
    );
  }

  /**
   *
   */
  async initialize({ skipCache = false }: Object = {}): Promise<void> {
    if (this.isInitialized() === true) {
      return;
    }

    if (skipCache === true) {
      await this.cache.del("hubspotProperties");
    }
    const hubspotContactProperties = await this.cache.wrap(
      "hubspotContactProperties",
      () => {
        return this.getContactPropertyGroups();
      }
    );
    const hubspotCompanyProperties = await this.cache.wrap(
      "hubspotCompanyProperties",
      () => {
        return this.hubspotClient.getCompanyPropertyGroups();
      }
    );

    this.contactPropertyUtil = new HubspotPropertyUtil({
      hubspotClient: this.hubspotClient,
      logger: this.logger,
      metric: this.metric,
      segments: this.usersSegments,
      hubspotProperties: hubspotContactProperties,
      serviceType: "contact"
    });

    this.companyPropertyUtil = new HubspotPropertyUtil({
      hubspotClient: this.hubspotClient,
      logger: this.logger,
      metric: this.metric,
      segments: this.accountsSegments,
      hubspotProperties: hubspotCompanyProperties,
      serviceType: "company"
    });

    this.mappingUtil = new MappingUtil({
      ctx: this.ctx,
      connector: this.connector,
      hullClient: this.hullClient,
      usersSegments: this.usersSegments,
      accountsSegments: this.accountsSegments,
      hubspotContactProperties,
      hubspotCompanyProperties
    });
  }

  isConfigured() {
    return (
      this.connector.private_settings &&
      !_.isEmpty(this.connector.private_settings.token)
    );
  }

  checkToken() {
    if (!this.isConfigured()) {
      this.hullClient.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }
    return this.hubspotClient.checkToken();
  }

  async getContactProperties(direction: ?string) {
    const groups = await this.cache.wrap("contact_properties", () =>
      this.getContactPropertyGroups()
    );
    return this.getHubspotEntityProperties({
      groups:
        direction === "incoming"
          ? _.concat(groups, defaultIncomingGroupMapping.contact)
          : groups,
      direction
    });
  }

  async getCompanyProperties(direction: ?string) {
    const groups = await this.cache.wrap("company_properties", () =>
      this.getCompanyPropertyGroups()
    );
    return this.getHubspotEntityProperties({ groups, direction });
  }

  async getOutgoingProperties(groups: Object) {
    try {
      const outgoingProps = _.reduce(
        groups,
        (formattedGroups, v) => {
          const { displayName, properties } = v;
          const duplicate = _.find(formattedGroups, entry => {
            return entry.label === displayName;
          });
          if (_.isNil(duplicate)) {
            formattedGroups.push({
              label: displayName,
              options: _.chain(properties)
                .filter(({ readOnlyValue }) => {
                  return !readOnlyValue;
                })
                .map(({ label, name }) => {
                  return { label, value: name };
                })
                .value()
            });
          }
          return formattedGroups;
        },
        []
      );
      return { options: outgoingProps };
    } catch (err) {
      return { options: [] };
    }
  }

  async getIncomingProperties(groups: Object) {
    try {
      return {
        options: groups.map(group => ({
          label: group.displayName,
          options: _.chain(group.properties)
            .map(({ label, name: value, type, fieldType }) => {
              if (label === "Contact ID") {
                return {
                  label,
                  value: "`canonical-vid` ? `canonical-vid` : `vid`"
                };
              }

              if (label === "Company ID") {
                return {
                  label,
                  value: "companyId"
                };
              }

              if (group.name === "contactmeta") {
                return { label, value: `\`${value}\`` };
              }

              if (type === "enumeration" && fieldType === "checkbox") {
                return {
                  label,
                  value: `properties.${value}.value.$split(';')`
                };
              }

              return { label, value: `properties.${value}.value` };
            })
            .value()
        }))
      };
    } catch (err) {
      return { options: [] };
    }
  }

  async getIncomingUserClaims() {
    const contactProperties = await this.getContactProperties();
    return {
      options: [
        {
          label: "Identity profile Email",
          value:
            "$['identity-profiles'][*].identities[?(@.type === 'EMAIL')].value"
        },
        {
          label: "VID",
          value: "vid"
        },
        ...contactProperties.options.map(({ label, options }) => ({
          label,
          options: options.map(({ label: optionLabel, value }) => {
            return {
              label: optionLabel,
              value
            };
          })
        }))
      ]
    };
  }

  async getIncomingAccountClaims() {
    const companyProperties = await this.getCompanyProperties();
    return {
      options: [
        {
          label: "Company ID",
          value: "companyId"
        },
        ...companyProperties.options.map(({ label, options }) => ({
          label,
          options: options.map(({ label: optionLabel, value }) => ({
            label: optionLabel,
            value
          }))
        }))
      ]
    };
  }

  /**
   * Reconcilation of the ship settings
   * @return {Promise}
   */
  async syncConnector(): Promise<*> {
    if (!this.isConfigured()) {
      this.hullClient.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }
    try {
      await this.initialize({ skipCache: true });

      await this.contactPropertyUtil.sync(this.mappingUtil.contactSchema);
      await this.companyPropertyUtil.sync(this.mappingUtil.companySchema);
    } catch (error) {
      this.hullClient.logger.error("outgoing.job.error", {
        error: error.message
      });
      return Promise.reject(error);
    }
    return Promise.resolve();
  }

  /**
   * creates or updates users
   * @see https://www.hull.io/docs/references/api/#endpoint-traits
   * @return {Promise}
   * @param hubspotProperties
   * @param contacts
   */
  saveContacts(contacts: Array<HubspotReadContact>): Promise<any> {
    this.logger.debug("saveContacts", contacts.length);
    this.metric.increment("ship.incoming.users", contacts.length);
    return Promise.all(
      contacts.map(async contact => {
        const traits = this.mappingUtil.mapToHullEntity(contact, "user");
        const ident = this.helpers.incomingClaims("user", contact, {
          anonymous_id_prefix: "hubspot",
          anonymous_id_service: "vid"
        });
        if (ident.error) {
          return this.logger.info("incoming.user.error", {
            contact,
            reason: ident.error
          });
        }
        this.logger.debug("incoming.user", { claims: ident.claims, traits });
        let asUser;
        try {
          asUser = this.hullClient.asUser(ident.claims);
        } catch (error) {
          return this.logger.info("incoming.user.error", {
            contact,
            error
          });
        }

        const mergedVids = _.get(contact, "merged-vids", []);
        _.forEach(mergedVids, vid => {
          asUser.alias({ anonymous_id: `hubspot:${vid}` });
        });

        if (this.connector.private_settings.link_users_in_hull === true) {
          if (contact.properties.associatedcompanyid) {
            const linkingClient = this.hullClient.asUser(ident.claims).account({
              anonymous_id: `hubspot:${contact.properties.associatedcompanyid.value}`
            });
            await linkingClient
              .traits({})
              .then(() => {
                return linkingClient.logger.info(
                  "incoming.account.link.success"
                );
              })
              .catch(error => {
                return linkingClient.logger.error(
                  "incoming.account.link.error",
                  error
                );
              });
          }
        } else {
          asUser.logger.debug("incoming.account.link.skip", {
            reason:
              "incoming linking is disabled, you can enabled it in the settings"
          });
        }

        return asUser.traits(traits).then(
          () => asUser.logger.debug("incoming.user.success", { traits }),
          error =>
            asUser.logger.error("incoming.user.error", {
              hull_summary: `Fetching data from Hubspot returned an error: ${_.get(
                error,
                "message",
                ""
              )}`,
              traits,
              errors: error
            })
        );
      })
    );
  }

  /**
   * Sends Hull users to Hubspot contacts using create or update strategy.
   * The job on Hubspot side is done async the returned Promise is resolved
   * when the query was queued successfully. It is rejected when:
   * "you pass an invalid email address, if a property in your request doesn't exist,
   * or if you pass an invalid property value."
   * @see http://developers.hubspot.com/docs/methods/contacts/batch_create_or_update
   * @return {Promise}
   * @param messages
   */
  async sendUserUpdateMessages(
    messages: Array<HullUserUpdateMessage>
  ): Promise<*> {
    if (!this.isConfigured()) {
      this.hullClient.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }
    await this.initialize();

    const envelopes = messages.map(message =>
      this.buildUpdateMessageEnvelope(message, "contact")
    );
    const filterResults = this.filterUtil.filterUserUpdateMessageEnvelopes(
      envelopes
    );

    this.hullClient.logger.debug("outgoing.job.start", {
      toSkip: filterResults.toSkip.length,
      toInsert: filterResults.toInsert.length,
      toUpdate: filterResults.toUpdate.length
    });

    filterResults.toSkip.forEach(envelope => {
      this.hullClient
        .asUser(envelope.message.user)
        .logger.debug("outgoing.user.skip", { reason: envelope.skipReason });
    });

    try {
      const noChangesSkip = [];

      filterResults.toInsert.forEach(envelope => {
        const toSend = toSendMessage(this.ctx, "user", envelope.message, {
          serviceName: "hubspot",
          sendOnAnySegmentChanges: true
        });
        if (!toSend) {
          noChangesSkip.push(envelope);
        }
      });

      noChangesSkip.forEach(envelope => {
        _.pull(filterResults.toInsert, envelope);
      });
    } catch (err) {
      console.log(err);
    }

    const envelopesToUpsert = filterResults.toInsert.concat(
      filterResults.toUpdate
    );

    try {
      await this.postEnvelopes({
        envelopes: envelopesToUpsert,
        hullEntity: "user",
        hubspotEntity: "contact",
        retry: 1
      });
    } catch (err) {
      this.hullClient.logger.error("outgoing.job.error", {
        error: err.message
      });
      return Promise.reject(err);
    }

    return Promise.resolve([]);
  }

  async sendAccountUpdateMessages(
    messages: Array<HullAccountUpdateMessage>
  ): Promise<*> {
    if (!this.isConfigured()) {
      this.hullClient.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }
    await this.initialize();
    const envelopes = messages.map(message =>
      this.buildUpdateMessageEnvelope(message, "company")
    );
    const filterResults = this.filterUtil.filterAccountUpdateMessageEnvelopes(
      envelopes
    );

    this.hullClient.logger.debug("outgoing.job.start", {
      toSkip: filterResults.toSkip.length,
      toInsert: filterResults.toInsert.length,
      toUpdate: filterResults.toUpdate.length
    });

    filterResults.toSkip.forEach(envelope => {
      this.hullClient
        .asAccount(envelope.message.account)
        .logger.debug("outgoing.account.skip", { reason: envelope.skipReason });
    });

    try {
      const noChangesSkip = [];
      const upsertResults = _.concat(
        filterResults.toInsert,
        filterResults.toUpdate
      );
      upsertResults.forEach(envelope => {
        const toSend = toSendMessage(this.ctx, "account", envelope.message, {
          serviceName: "hubspot",
          sendOnAnySegmentChanges: true
        });
        if (!toSend) {
          noChangesSkip.push(envelope);
        }
      });

      noChangesSkip.forEach(envelope => {
        _.pull(filterResults.toInsert, envelope);
        _.pull(filterResults.toUpdate, envelope);
      });
    } catch (err) {
      console.log(err);
    }

    const accountsToUpdate = filterResults.toUpdate;
    const accountsToInsert = [];
    try {
      // first perform search for companies to be updated
      await Promise.all(
        filterResults.toInsert.map(async envelopeToInsert => {
          // @TODO domains seems to be empty in some cases - fix flow or fix code?
          const domain = envelopeToInsert.message.account.domain;
          const results = await this.hubspotClient.postCompanyDomainSearch(
            domain
          );
          if (results.body.results && results.body.results.length > 0) {
            const existingCompanies = _.sortBy(
              results.body.results,
              "properties.hs_lastmodifieddate.value"
            );
            const envelopeToUpdate = _.cloneDeep(envelopeToInsert);
            envelopeToUpdate.hubspotWriteCompany.objectId = _.last(
              existingCompanies
            ).companyId.toString();
            accountsToUpdate.push(envelopeToUpdate);
          } else {
            accountsToInsert.push(envelopeToInsert);
          }
        })
      );

      // update companies
      await this.postEnvelopes({
        envelopes: accountsToUpdate,
        hullEntity: "account",
        hubspotEntity: "company",
        operation: "update",
        retry: 1
      });

      // insert companies
      await this.hubspotClient
        .postCompaniesInsertEnvelopes({ envelopes: accountsToInsert })
        .then(resultEnvelopes => {
          resultEnvelopes.forEach(envelope => {
            if (envelope.error === undefined && envelope.hubspotReadCompany) {
              const accountTraits = this.mappingUtil.mapToHullEntity(
                envelope.hubspotReadCompany,
                "account"
              );
              const accountIdentity = this.helpers.incomingClaims(
                "account",
                envelope.hubspotReadCompany,
                {
                  anonymous_id_prefix: "hubspot",
                  anonymous_id_service: "companyId"
                }
              );
              return this.hullClient
                .asAccount(accountIdentity.claims)
                .traits(accountTraits)
                .then(() => {
                  return this.hullClient
                    .asAccount(envelope.message.account)
                    .logger.info("outgoing.account.success", {
                      hubspotWriteCompany: envelope.hubspotWriteCompany,
                      operation: "insert"
                    });
                });
            }
            return this.hullClient
              .asAccount(envelope.message.account)
              .logger.error("outgoing.account.error", {
                error: envelope.error,
                hubspotWriteCompany: envelope.hubspotWriteCompany,
                operation: "insert"
              });
          });
        });
    } catch (error) {
      this.hullClient.logger.error("outgoing.job.error", {
        error: error.message
      });
      return Promise.reject(error);
    }
    return Promise.resolve();
  }

  async postEnvelopes({
    envelopes,
    hullEntity,
    hubspotEntity,
    retry,
    operation
  }) {
    return this.hubspotClient
      .postEnvelopes({
        envelopes,
        hubspotEntity
      })
      .then(upsertedEnvelopes => {
        this.logSuccessfulUpsert({
          envelopes: upsertedEnvelopes,
          hullEntity,
          operation
        });
      })
      .catch(async error => {
        const errorInfo = error.response.body;
        if (errorInfo.status !== "error") {
          envelopes.forEach(envelope => {
            if (hullEntity === "user") {
              this.hullClient
                .asUser(envelope.message.user)
                .logger.error("outgoing.user.error", {
                  error: "unknown response from hubspot",
                  hubspotWriteContact: envelope.hubspotWriteContact
                });
            } else {
              this.hullClient
                .asAccount(envelope.message.account)
                .logger.error("outgoing.account.error", {
                  error: "unknown response from hubspot",
                  hubspotWriteCompany: envelope.hubspotWriteCompany
                });
            }
          });
          return Promise.resolve([]);
        }

        const [
          retryEnvelopes,
          failedEnvelopes,
          hullFailedEnvelopes
        ] = this.filterFailedEnvelopes({ envelopes, errorInfo, hubspotEntity });

        this.logFailedUpsert({
          envelopes: _.cloneDeep(failedEnvelopes),
          hullEntity
        });

        if (!_.isEmpty(hullFailedEnvelopes)) {
          await this.syncConnector();
          _.pullAll(hullFailedEnvelopes, failedEnvelopes);
        }

        if (retry > 0) {
          return this.postEnvelopes({
            envelopes: [...retryEnvelopes, ...hullFailedEnvelopes],
            hullEntity,
            hubspotEntity,
            operation,
            retry: retry - 1
          });
        }

        this.logFailedUpsert({
          envelopes: [...retryEnvelopes, ...hullFailedEnvelopes],
          hullEntity
        });
        return Promise.resolve([]);
      });
  }

  buildUpdateMessageEnvelope(
    message: HullUserUpdateMessage | HullAccountUpdateMessage,
    serviceType: ServiceType
  ): HubspotUserUpdateMessageEnvelope | HubspotAccountUpdateMessageEnvelope {
    if (serviceType === "contact") {
      message.user.account = message.account;
    }

    const hubspotWriteEntity = this.mappingUtil.mapToHubspotEntity(
      message,
      serviceType
    );
    return {
      message,
      [`hubspotWrite${_.upperFirst(serviceType)}`]: hubspotWriteEntity
    };
  }

  async getContactPropertiesKeys() {
    const {
      incoming_user_claims = [],
      incoming_user_attributes = []
    } = this.connector.private_settings;
    return this.mappingUtil.getHubspotPropertyKeys({
      identityClaims: incoming_user_claims,
      attributeMapping: incoming_user_attributes
    });
  }

  /**
   * Job which performs fetchAll operations queues itself and the import job
   * @param  {Number} count
   * @param  {Number} [offset=0]
   * @return {Promise}
   */
  async fetchAllContacts(): Promise<any> {
    await this.initialize();
    const {
      incoming_user_claims = [],
      incoming_user_attributes = []
    } = this.connector.private_settings;
    const propertiesToFetch = this.mappingUtil.getHubspotPropertyKeys({
      identityClaims: incoming_user_claims,
      attributeMapping: incoming_user_attributes
    });
    let progress = 0;

    this.hullClient.logger.info("incoming.job.start", {
      jobName: "fetchAllContacts",
      type: "user",
      propertiesToFetch
    });

    const streamOfIncomingContacts = this.hubspotClient.getAllContactsStream(
      propertiesToFetch
    );

    try {
      await pipeStreamToPromise(streamOfIncomingContacts, contacts => {
        progress += contacts.length;
        this.progressUtil.update(progress);
        this.hullClient.logger.info("incoming.job.progress", {
          jobName: "fetchAllContacts",
          type: "user",
          progress
        });
        return this.saveContacts(contacts);
      });
      this.hullClient.logger.info("incoming.job.success", {
        jobName: "fetchAllContacts"
      });
      return {
        status: "ok"
      };
    } catch (error) {
      this.hullClient.logger.info("incoming.job.error", {
        jobName: "fetchAllContacts",
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  async fetchAllCompanies(): Promise<any> {
    await this.initialize();
    const {
      incoming_account_claims = [],
      incoming_account_attributes = []
    } = this.connector.private_settings;
    const propertiesToFetch = this.mappingUtil.getHubspotPropertyKeys({
      identityClaims: incoming_account_claims,
      attributeMapping: incoming_account_attributes
    });
    let progress = 0;

    this.hullClient.logger.info("incoming.job.start", {
      jobName: "fetchAllCompanies",
      type: "user",
      propertiesToFetch
    });

    const streamOfIncomingCompanies = this.hubspotClient.getAllCompaniesStream(
      propertiesToFetch
    );

    try {
      await pipeStreamToPromise(streamOfIncomingCompanies, companies => {
        progress += companies.length;
        this.progressUtil.updateAccount(progress);
        this.hullClient.logger.info("incoming.job.progress", {
          jobName: "fetchAllCompanies",
          type: "account",
          progress
        });
        return this.saveCompanies(companies);
      });
      this.hullClient.logger.info("incoming.job.success", {
        jobName: "fetchAllCompanies"
      });
      return {
        status: "ok"
      };
    } catch (error) {
      this.hullClient.logger.info("incoming.job.error", {
        jobName: "fetchAllCompanies",
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  saveCompanies(companies: Array<HubspotReadCompany>): Promise<any> {
    if (this.fetchAccounts !== true) {
      return Promise.resolve();
    }
    this.logger.debug("saveCompanies", companies.length);
    this.metric.increment("ship.incoming.accounts", companies.length);
    return Promise.all(
      companies.map(async company => {
        const traits = this.mappingUtil.mapToHullEntity(company, "account");
        const ident = this.helpers.incomingClaims("account", company, {
          anonymous_id_prefix: "hubspot",
          anonymous_id_service: "companyId"
        });
        if (ident.error) {
          return this.logger.info("incoming.account.skip", {
            company: company.companyId,
            reason: ident.error
          });
        }
        this.logger.debug("incoming.account", { claims: ident.claims, traits });
        let asAccount;
        try {
          asAccount = this.hullClient.asAccount(ident.claims);
        } catch (error) {
          return this.logger.info("incoming.account.skip", {
            company: company.companyId,
            error
          });
        }

        const { mergeAudits } = company;
        if (!_.isNil(mergeAudits)) {
          _.forEach(_.map(mergeAudits, "mergedCompanyId"), companyId => {
            asAccount.alias({ anonymous_id: `hubspot:${companyId}` });
          });
        }

        await asAccount.traits(traits).then(
          () => asAccount.logger.debug("incoming.account.success", { traits }),
          error =>
            asAccount.logger.error("incoming.account.error", {
              hull_summary: `Fetching data from Hubspot returned an error: ${_.get(
                error,
                "message",
                ""
              )}`,
              traits,
              errors: error
            })
        );

        return Promise.resolve();
      })
    );
  }

  logSuccessfulUpsert({ envelopes, hullEntity, operation }) {
    envelopes.forEach(envelope => {
      if (hullEntity === "user") {
        this.hullClient
          .asUser(envelope.message.user)
          .logger.info("outgoing.user.success", {
            hubspotWriteContact: envelope.hubspotWriteContact
          });
      } else {
        this.hullClient
          .asAccount(envelope.message.account)
          .logger.info("outgoing.account.success", {
            hubspotWriteCompany: envelope.hubspotWriteCompany,
            operation
          });
      }
    });
  }

  logFailedUpsert({ envelopes, hullEntity }) {
    envelopes.forEach(erroredEnvelope => {
      if (hullEntity === "user") {
        this.hullClient
          .asUser(erroredEnvelope.message.user)
          .logger.error("outgoing.user.error", {
            error: erroredEnvelope.error || "outgoing batch rejected",
            hubspotWriteContact: erroredEnvelope.hubspotWriteContact
          });
      } else {
        this.hullClient
          .asAccount(erroredEnvelope.message.account)
          .logger.error("outgoing.account.error", {
            error: erroredEnvelope.error || "outgoing batch rejected",
            hubspotWriteCompany: erroredEnvelope.hubspotWriteCompany
          });
      }
    });
  }

  filterFailedEnvelopes({ envelopes, errorInfo, hubspotEntity }) {
    const { failureMessages, validationResults } = errorInfo;
    let segmentSyncFailures = [];

    if (hubspotEntity === "contact") {
      segmentSyncFailures = _.filter(failureMessages, {
        propertyValidationResult: { name: "hull_segments" }
      });

      if (!_.isEmpty(segmentSyncFailures)) {
        _.pullAll(failureMessages, segmentSyncFailures);
      }
    }

    if (hubspotEntity === "company") {
      segmentSyncFailures = _.filter(validationResults, {
        name: "hull_segments"
      });

      if (!_.isEmpty(segmentSyncFailures)) {
        _.pullAll(validationResults, segmentSyncFailures);
      }
    }

    return envelopes.reduce(
      ([toRetry, rejected, hullSyncRejected], envelope, index) => {
        let failureMessage;
        let hullSyncFailureMessage;

        if (hubspotEntity === "contact") {
          failureMessage = _.find(failureMessages, { index });
          hullSyncFailureMessage = _.find(segmentSyncFailures, {
            index,
            propertyValidationResult: { name: "hull_segments" }
          });
        }
        if (hubspotEntity === "company") {
          failureMessage = _.find(validationResults, {
            id: envelope.hubspotWriteCompany.objectId
          });
          hullSyncFailureMessage = _.find(segmentSyncFailures, {
            id: envelope.hubspotWriteCompany.objectId
          });
        }

        if (!_.isNil(hullSyncFailureMessage)) {
          hullSyncRejected.push(
            this.buildFailedEnvelope(envelope, hullSyncFailureMessage)
          );
        }

        if (!_.isNil(failureMessage)) {
          rejected.push(this.buildFailedEnvelope(envelope, failureMessage));
        }

        if (_.isNil(failureMessage) && _.isNil(hullSyncFailureMessage)) {
          _.unset(envelope, "error");
          _.unset(envelope, "errorProperty");
          toRetry.push(envelope);
        }

        return [toRetry, rejected, hullSyncRejected];
      },
      [[], [], []]
    );
  }

  buildFailedEnvelope(envelope, error) {
    const hubspotMessage =
      error.propertyValidationResult &&
      _.truncate(error.propertyValidationResult.message, {
        length: 100
      });
    const hubspotPropertyName =
      error.propertyValidationResult && error.propertyValidationResult.name;
    envelope.error = hubspotMessage || error.message || error.error.message;
    envelope.errorProperty = hubspotPropertyName;

    return envelope;
  }

  getPortalInformation() {
    return this.hubspotClient.getPortalInformation();
  }

  async getContactPropertyGroups(): Array<HubspotPropertyGroup> {
    return this.hubspotClient.getContactPropertyGroups();
  }

  async getCompanyPropertyGroups(): Array<HubspotPropertyGroup> {
    return this.hubspotClient.getCompanyPropertyGroups();
  }

  async getHubspotEntityProperties({ groups, direction }) {
    if (direction === "outgoing") {
      return this.getOutgoingProperties(
        _.concat(groups, defaultOutgoingGroupMapping)
      );
    }
    return this.getIncomingProperties(groups);
  }
}

module.exports = SyncAgent;
