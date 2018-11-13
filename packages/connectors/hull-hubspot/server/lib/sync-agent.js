// @flow
import type {
  HullUserUpdateMessage,
  HullConnector,
  HullContext,
  HullSegment,
  HullAccountUpdateMessage
} from "hull";

import type {
  HubspotAccountUpdateMessageEnvelope,
  HubspotUserUpdateMessageEnvelope,
  HubspotReadContact,
  HubspotReadCompany
} from "../types";

// const Promise = require("bluebird");
const _ = require("lodash");
const moment = require("moment");
const debug = require("debug")("hull-hubspot:sync-agent");

const { pipeStreamToPromise } = require("hull/src/utils");
const HubspotClient = require("./hubspot-client");
const ContactPropertyUtil = require("./sync-agent/contact-property-util");
const CompanyPropertyUtil = require("./sync-agent/company-property-util");
const MappingUtil = require("./sync-agent/mapping-util");
const ProgressUtil = require("./sync-agent/progress-util");
const FilterUtil = require("./sync-agent/filter-util");

const hullClientAccountPropertiesUtil = require("../hull-client-account-properties-util");

class SyncAgent {
  hubspotClient: HubspotClient;

  contactPropertyUtil: ContactPropertyUtil;

  companyPropertyUtil: CompanyPropertyUtil;

  mappingUtil: MappingUtil;

  progressUtil: ProgressUtil;

  filterUtil: FilterUtil;

  connector: HullConnector;

  hullClient: Object;

  metric: Object;

  helpers: Object;

  logger: Object;

  usersSegments: Array<HullSegment>;

  accountsSegments: Array<HullSegment>;

  cache: Object;

  isBatch: boolean;

  settingsUpdate: $PropertyType<
    $PropertyType<HullContext, "helpers">,
    "settingsUpdate"
  >;

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
    this.settingsUpdate = ctx.helpers.settingsUpdate;
  }

  isInitialized(): boolean {
    return (
      this.contactPropertyUtil instanceof ContactPropertyUtil &&
      this.companyPropertyUtil instanceof CompanyPropertyUtil &&
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
      await this.cache.del("hullProperties");
    }
    const hubspotContactProperties = await this.cache.wrap(
      "hubspotContactProperties",
      () => {
        return this.hubspotClient.getContactPropertyGroups();
      }
    );
    const hubspotCompanyProperties = await this.cache.wrap(
      "hubspotCompanyProperties",
      () => {
        return this.hubspotClient.getCompanyPropertyGroups();
      }
    );

    const hullUserProperties = await this.cache.wrap(
      "hullUserProperties",
      () => {
        return this.hullClient.utils.properties.get();
      }
    );

    const hullAccountProperties = await this.cache.wrap(
      "hullAccountProperties",
      () => {
        return hullClientAccountPropertiesUtil({
          client: this.hullClient
        });
      }
    );
    debug("initialize", {
      usersSegments: typeof this.usersSegments,
      accountsSegments: typeof this.accountsSegments,
      hubspotContactProperties: typeof hubspotContactProperties,
      hubspotCompanyProperties: typeof hubspotCompanyProperties,
      hullUserProperties: typeof hullUserProperties,
      hullAccountProperties: typeof hullAccountProperties
    });
    this.contactPropertyUtil = new ContactPropertyUtil({
      hubspotClient: this.hubspotClient,
      logger: this.logger,
      metric: this.metric,
      usersSegments: this.usersSegments,
      hubspotProperties: hubspotContactProperties,
      hullProperties: hullUserProperties
    });

    this.companyPropertyUtil = new CompanyPropertyUtil({
      hubspotClient: this.hubspotClient,
      logger: this.logger,
      metric: this.metric,
      accountsSegments: this.accountsSegments,
      hubspotProperties: hubspotCompanyProperties,
      hullProperties: hullAccountProperties
    });

    this.mappingUtil = new MappingUtil({
      connector: this.connector,
      hullClient: this.hullClient,
      usersSegments: this.usersSegments,
      accountsSegments: this.accountsSegments,
      hubspotContactProperties,
      hubspotCompanyProperties,
      hullUserProperties,
      hullAccountProperties
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

  getContactProperties() {
    return this.cache
      .wrap("contact_properties", () => {
        return this.hubspotClient.getContactPropertyGroups();
      })
      .then(groups => {
        return {
          options: groups.map(group => {
            return {
              label: group.displayName,
              options: _.chain(group.properties)
                .map(prop => {
                  return {
                    label: prop.label,
                    value: prop.name
                  };
                })
                .value()
            };
          })
        };
      })
      .catch(() => {
        return { options: [] };
      });
  }

  getCompanyProperties() {
    return this.cache
      .wrap("company_properties", () => {
        return this.hubspotClient.getCompanyPropertyGroups();
      })
      .then(groups => {
        return {
          options: groups.map(group => {
            return {
              label: group.displayName,
              options: _.chain(group.properties)
                .map(prop => {
                  return {
                    label: prop.label,
                    value: prop.name
                  };
                })
                .value()
            };
          })
        };
      })
      .catch(() => {
        return { options: [] };
      });
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
    await this.initialize({ skipCache: true });

    await this.contactPropertyUtil.sync(
      this.mappingUtil.contactOutgoingMapping
    );
    return this.companyPropertyUtil.sync(
      this.mappingUtil.companyOutgoingMapping
    );
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
    this.metric.value("ship.incoming.users", contacts.length);
    return Promise.all(
      contacts.map(async contact => {
        const traits = this.mappingUtil.getHullUserTraits(contact);
        const ident = this.mappingUtil.getHullUserIdentFromHubspot(contact);
        if (!ident.email) {
          return this.logger.info("incoming.user.skip", {
            contact,
            reason: "missing email"
          });
        }
        this.logger.debug("incoming.user", { ident, traits });
        let asUser;
        try {
          asUser = this.hullClient.asUser(ident);
        } catch (error) {
          return this.logger.info("incoming.user.skip", {
            contact,
            error
          });
        }

        if (
          this.connector.private_settings.link_users_in_hull === true &&
          contact.properties.associatedcompanyid
        ) {
          const linkingClient = this.hullClient.asUser(ident).account({
            anonymous_id: `hubspot:${
              contact.properties.associatedcompanyid.value
            }`
          });
          await linkingClient
            .traits({})
            .then(() => {
              return linkingClient.logger.info("incoming.account.link.success");
            })
            .catch(error => {
              return linkingClient.logger.error(
                "incoming.account.link.error",
                error
              );
            });
        } else {
          asUser.logger.info("incoming.account.link.skip", {
            reason:
              "incoming linking is disabled, you can enabled it in the settings"
          });
        }

        return asUser.traits(traits).then(
          () => asUser.logger.info("incoming.user.success", { traits }),
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
   * @param  {Array} users users from Hull
   * @return {Promise}
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
      this.buildUserUpdateMessageEnvelope(message)
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
        .logger.info("outgoing.user.skip", { reason: envelope.skipReason });
    });

    const envelopesToUpsert = filterResults.toInsert.concat(
      filterResults.toUpdate
    );
    return this.hubspotClient
      .postContactsEnvelopes(envelopesToUpsert)
      .then(resultEnvelopes => {
        resultEnvelopes.forEach(envelope => {
          if (envelope.error === undefined) {
            this.hullClient
              .asUser(envelope.message.user)
              .logger.info(
                "outgoing.user.success",
                envelope.hubspotWriteContact
              );
          } else {
            this.hullClient
              .asUser(envelope.message.user)
              .logger.error("outgoing.user.error", envelope.error);
          }
        });
      });
  }

  buildUserUpdateMessageEnvelope(
    message: HullUserUpdateMessage
  ): HubspotUserUpdateMessageEnvelope {
    // $FlowFixMe
    message.user.account = message.account;
    const hubspotWriteContact = this.mappingUtil.getHubspotContact(message);
    return {
      message,
      hubspotWriteContact
    };
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
      this.buildAccountUpdateMessageEnvelope(message)
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
        .logger.info("outgoing.account.skip", { reason: envelope.skipReason });
    });

    const accountsToUpdate = filterResults.toUpdate;
    const accountsToInsert = [];

    // first perform search for companies to be updated
    await Promise.all(
      filterResults.toInsert.map(async envelopeToInsert => {
        const domain = envelopeToInsert.message.account.domain; // TODO
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
    await this.hubspotClient
      .postCompaniesUpdateEnvelopes(accountsToUpdate)
      .then(resultEnvelopes => {
        resultEnvelopes.forEach(envelope => {
          if (envelope.error === undefined) {
            return this.hullClient
              .asAccount(envelope.message.account)
              .logger.info("outgoing.account.success", {
                hubspotWriteCompany: envelope.hubspotWriteCompany,
                operation: "update"
              });
          }
          return this.hullClient
            .asAccount(envelope.message.account)
            .logger.error("outgoing.account.error", envelope.error);
        });
      });

    // insert companies
    return this.hubspotClient
      .postCompaniesEnvelopes(accountsToInsert)
      .then(resultEnvelopes => {
        resultEnvelopes.forEach(envelope => {
          if (envelope.error === undefined && envelope.hubspotReadCompany) {
            const accountTraits = this.mappingUtil.getHullAccountTraits(
              envelope.hubspotReadCompany
            );
            return this.hullClient
              .asAccount(envelope.message.account)
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
            .logger.error("outgoing.account.error", envelope.error);
        });
      });
  }

  buildAccountUpdateMessageEnvelope(
    message: HullAccountUpdateMessage
  ): HubspotAccountUpdateMessageEnvelope {
    const hubspotWriteCompany = this.mappingUtil.getHubspotCompany(message);
    return {
      message,
      hubspotWriteCompany
    };
  }

  /**
   * Handles operation for automatic sync changes of hubspot profiles
   * to hull users.
   */
  async fetchRecentContacts(): Promise<any> {
    await this.initialize();
    const lastFetchAt =
      this.connector.private_settings.last_fetch_at ||
      moment()
        .subtract(1, "hour")
        .format();
    const stopFetchAt = moment().format();
    const propertiesToFetch = this.mappingUtil.getHubspotContactPropertiesKeys();
    let progress = 0;

    this.hullClient.logger.info("incoming.job.start", {
      jobName: "fetch",
      type: "user",
      lastFetchAt,
      stopFetchAt,
      propertiesToFetch
    });
    await this.settingsUpdate({
      last_fetch_at: stopFetchAt
    });

    const streamOfIncomingContacts = this.hubspotClient.getRecentContactsStream(
      lastFetchAt,
      stopFetchAt,
      propertiesToFetch
    );

    return pipeStreamToPromise(streamOfIncomingContacts, contacts => {
      progress += contacts.length;
      this.hullClient.logger.info("incoming.job.progress", {
        jobName: "fetch",
        type: "user",
        progress
      });
      return this.saveContacts(contacts);
    })
      .then(() => {
        this.hullClient.logger.info("incoming.job.success", {
          jobName: "fetch"
        });
      })
      .catch(error => {
        this.hullClient.logger.info("incoming.job.error", {
          jobName: "fetch",
          error
        });
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
    const propertiesToFetch = this.mappingUtil.getHubspotContactPropertiesKeys();
    let progress = 0;

    this.hullClient.logger.info("incoming.job.start", {
      jobName: "fetchAllContacts",
      type: "user",
      propertiesToFetch
    });

    const streamOfIncomingContacts = this.hubspotClient.getAllContactsStream(
      propertiesToFetch
    );

    return pipeStreamToPromise(streamOfIncomingContacts, contacts => {
      progress += contacts.length;
      this.progressUtil.update(progress);
      this.hullClient.logger.info("incoming.job.progress", {
        jobName: "fetchAllContacts",
        type: "user",
        progress
      });
      return this.saveContacts(contacts);
    })
      .then(() => {
        this.hullClient.logger.info("incoming.job.success", {
          jobName: "fetchAllContacts"
        });
      })
      .catch(error => {
        this.hullClient.logger.info("incoming.job.error", {
          jobName: "fetchAllContacts",
          error: error.message
        });
      });
  }

  /**
   * Handles operation for automatic sync changes of hubspot profiles
   * to hull users.
   */
  async fetchRecentCompanies(): Promise<any> {
    await this.initialize();
    const lastFetchAt =
      this.connector.private_settings.companies_last_fetch_at ||
      moment()
        .subtract(1, "hour")
        .format();
    const stopFetchAt = moment().format();
    const propertiesToFetch = this.mappingUtil.getHubspotCompanyPropertiesKeys();
    let progress = 0;

    this.hullClient.logger.info("incoming.job.start", {
      jobName: "fetch",
      type: "account",
      lastFetchAt,
      stopFetchAt,
      propertiesToFetch
    });
    await this.settingsUpdate({
      companies_last_fetch_at: stopFetchAt
    });

    const streamOfIncomingCompanies = this.hubspotClient.getRecentCompaniesStream(
      lastFetchAt,
      stopFetchAt,
      propertiesToFetch
    );

    return pipeStreamToPromise(streamOfIncomingCompanies, companies => {
      progress += companies.length;
      this.hullClient.logger.info("incoming.job.progress", {
        jobName: "fetch",
        type: "account",
        progress
      });
      return this.saveCompanies(companies);
    })
      .then(() => {
        this.hullClient.logger.info("incoming.job.success", {
          jobName: "fetch"
        });
      })
      .catch(error => {
        this.hullClient.logger.info("incoming.job.error", {
          jobName: "fetch",
          error
        });
      });
  }

  async fetchAllCompanies(): Promise<any> {
    await this.initialize();
    const propertiesToFetch = this.mappingUtil.getHubspotCompanyPropertiesKeys();
    let progress = 0;

    this.hullClient.logger.info("incoming.job.start", {
      jobName: "fetchAllCompanies",
      type: "user",
      propertiesToFetch
    });

    const streamOfIncomingCompanies = this.hubspotClient.getAllCompaniesStream(
      propertiesToFetch
    );

    return pipeStreamToPromise(streamOfIncomingCompanies, companies => {
      progress += companies.length;
      this.hullClient.logger.info("incoming.job.progress", {
        jobName: "fetchAllCompanies",
        type: "account",
        progress
      });
      return this.saveCompanies(companies);
    })
      .then(() => {
        this.hullClient.logger.info("incoming.job.success", {
          jobName: "fetchAllCompanies"
        });
      })
      .catch(error => {
        this.hullClient.logger.info("incoming.job.error", {
          jobName: "fetchAllCompanies",
          error: error.message
        });
      });
  }

  saveCompanies(companies: Array<HubspotReadCompany>): Promise<any> {
    this.logger.debug("saveContacts", companies.length);
    this.metric.value("ship.incoming.accounts", companies.length);
    return Promise.all(
      companies.map(async company => {
        const traits = this.mappingUtil.getHullAccountTraits(company);
        const ident = this.mappingUtil.getHullAccountIdentFromHubspot(company);
        const canFetchAccount = this.filterUtil.filterIncomingAccountIdent(
          ident
        );
        if (canFetchAccount !== true) {
          return this.logger.info("incoming.account.skip", {
            company,
            reason: canFetchAccount
          });
        }
        this.logger.debug("incoming.account", { ident, traits });
        let asAccount;
        try {
          asAccount = this.hullClient.asAccount(ident);
        } catch (error) {
          return this.logger.info("incoming.account.skip", {
            company,
            error
          });
        }

        await asAccount.traits(traits).then(
          () => asAccount.logger.info("incoming.account.success", { traits }),
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
        if (this.connector.private_settings.link_users_in_hull !== true) {
          asAccount.logger.info("incoming.account.link.skip", {
            reason:
              "incoming linking is disabled, you can enabled it in the settings"
          });
          return Promise.resolve();
        }
        const companyVidsStream = this.hubspotClient.getCompanyVidsStream(
          company.companyId
        );
        return pipeStreamToPromise(companyVidsStream, vids => {
          return Promise.all(
            vids.map(vid => {
              const linkingClient = this.hullClient
                .asUser({ anonymous_id: `hubspot:${vid}` })
                .account(ident);
              return linkingClient
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
            })
          );
        });
      })
    );
  }
}

module.exports = SyncAgent;
