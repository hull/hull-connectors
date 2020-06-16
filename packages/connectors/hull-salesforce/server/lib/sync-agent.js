/* @flow */
import type { THullUserUpdateMessage, THullAccountUpdateMessage } from "hull";
import type {
  IAttributesMapper, IApiResultObject,
  IConnectionOptions, IOauth2Credentials, ISalesforceClientOptions,
  IUserUpdateEnvelope, IAccountUpdateEnvelope, THullObject, TResourceType
} from "./types";

const _ = require("lodash");
const camelize = require("camelize");
const Promise = require("bluebird");

const getMappings = require("./sync-agent/mapping-util");
const PatchUtil = require("./sync-agent/patch-util");
const { AttributesMapper } = require("./sync-agent/attributes-mapper");
const FilterUtil = require("./sync-agent/filter-util");
const QueryUtil = require("./sync-agent/query-util");
const MatchUtil = require("./sync-agent/match-util");
const IdentityUtil = require("./utils/identity-utils");
const { sendEvents } = require("./sync-agent/actions/outgoing/send-events");
const SalesforceClient = require("./service-client");
const { getResourceSchema } = require("./utils/get-fields-schema");
const { errors } = require("./errors");
const { RELATED_ENTITY_MAPPING } = require("../lib/sync-agent/mappings");
const { getFieldsSchema } = require("./utils/get-fields-schema");

function createConnectionOptions(ship: Object, oauth2: IOauth2Credentials): IConnectionOptions {
  const keys = ["access_token", "refresh_token", "instance_url"];
  const opts = camelize(_.pick(ship.private_settings, ...keys));
  opts.oauth2 = oauth2 || {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  };
  opts.logLevel = "ERROR";
  return opts;
}

class SyncAgent {
  attributesMapper: IAttributesMapper;
  patchUtil: PatchUtil;
  hullClient: Object;
  metric: Object;
  sf: SalesforceClient;
  fetchResourceSchema: boolean;
  fetchAccounts: boolean;
  linkAccounts: boolean;
  leadAssignmentRuleOnCreate: string;
  leadAssignmentRuleOnUpdate: string;
  mappings: Object;
  accountClaims: Array<Object>;
  userClaims: Array<Object>;
  filterUtil: FilterUtil;
  queryUtil: QueryUtil;
  matchUtil: MatchUtil;
  requireEmail: boolean;
  privateSettings: Object;
  cache: Object;
  isBatch: boolean;
  asEntity: any;

  constructor(ctx: Object) {
    const { client, cache, metric } = ctx;
    const connector = _.get(ctx, "connector") || _.get(ctx, "ship");
    this.cache = cache;
    this.privateSettings = connector.private_settings;
    this.fetchAccounts = connector.private_settings.fetch_accounts;
    this.linkAccounts = _.get(connector, "private_settings.link_accounts", false);
    this.fetchResourceSchema = _.get(connector, "private_settings.fetch_resource_schema", false);
    this.leadAssignmentRuleOnCreate = connector.private_settings.lead_assignmentrule;
    this.leadAssignmentRuleOnUpdate = _.get(connector, "private_settings.lead_assignmentrule_update", "");
    this.requireEmail = _.get(connector, "private_settings.ignore_users_withoutemail", false);
    this.mappings = getMappings(connector);
    this.isBatch = _.get(ctx.notification, "is_export", false);
    this.accountClaims = _.get(connector, "private_settings.account_claims", []);
    this.userClaims = [{
      hull: "email",
      service: "Email"
    }];

    this.hullClient = client;
    this.metric = metric;
    const clntOpts: ISalesforceClientOptions = {
      connection: createConnectionOptions(connector, connector.private_settings.oauth2),
      logger: this.hullClient.logger,
      metrics: this.metric
    };
    this.sf = new SalesforceClient(clntOpts);
    this.patchUtil = new PatchUtil(connector.private_settings);
    this.attributesMapper = new AttributesMapper(connector.private_settings);
    this.filterUtil = new FilterUtil(connector.private_settings);
    this.queryUtil = new QueryUtil();
    this.matchUtil = new MatchUtil();
    this.asEntity = () => {};

    this.sf.on("refresh", (accessToken, res) => {
      this.hullClient.logger.debug("connector.sfClient.refresh", { accessToken, res });
    });
  }

  fetchLeadAssignmentRules() {
    return this.sf.fetchAssignmentRules("Lead");
  }

  relatedEntityFields(resourceType) {
    const mapping = RELATED_ENTITY_MAPPING[_.upperFirst(resourceType)];
    return _.map(mapping, field => {
      return {
        value: field.attribute,
        label: field.attribute.replace(".", "")
      };
    });
  }

  getSalesforceProperties({ entity, fieldType }) {
    const grouping = _.isEmpty(fieldType) ? entity : `${entity}_${fieldType}`;
    return this.cache
      .wrap("fieldsSchema", () => {
        return getFieldsSchema(this.sf, this.mappings);
      })
      .then((definitions = {}) => {
        const schema = _.concat(
          (definitions[grouping] || []).map(t => {
            return { value: t.name, label: t.name };
          }),
          this.relatedEntityFields(grouping) || []
        );
        return { options: schema };
      });
  }

  // TODO fix attribute mapper so this is no longer needed
  enrichMessages(hullEntityType: string, messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>) {
    _.forEach(messages, (message) => {
      if (hullEntityType === "user") {
        const account = _.get(message, "account", {});
        _.set(message.user, "account", account);
      }
    });
  }

  async sendUserMessages(messages: Array<THullUserUpdateMessage>): Promise<*> {
    this.asEntity = this.hullClient.asUser;
    this.enrichMessages("user", messages);
    return this.sendMessages("user", messages);
  }

  async sendAccountMessages(messages: Array<THullAccountUpdateMessage>): Promise<*> {
    this.asEntity = this.hullClient.asAccount;
    return this.sendMessages("account", messages);
  }

  async sendMessages(hullEntityType: string, messages: Array<THullAccountUpdateMessage>): Promise<*> {
    const sendHullEvents = _.get(this.privateSettings, "send_outgoing_tasks", false);

    const dedupedMessages = this.filterUtil.filterDuplicateMessages(messages, hullEntityType);
    const findableMessages = this.filterUtil.filterFindableMessages(hullEntityType, dedupedMessages, this.isBatch);

    if (findableMessages.length === 0) {
      dedupedMessages.forEach((message) => {
        this.asEntity(_.get(message, hullEntityType))
          .logger.debug(`outgoing.${hullEntityType}.skip`, { reason: `No valid ${hullEntityType} messages to send` });
      });
      return Promise.resolve({});
    }
    const entitiesSent = hullEntityType === "account" ?
      await this.sendAccounts(dedupedMessages) :
      await this.sendUsers(dedupedMessages);

    if (hullEntityType === "user" && sendHullEvents) {
      const hullEventIdentifier = _.get(this.privateSettings, "hull_event_id", null);
      const sfExternalIdentifier = _.get(this.privateSettings, "salesforce_external_id", null);

      if (sfExternalIdentifier !== null && hullEventIdentifier !== null) {
        await sendEvents(this.hullClient, this.sf, this.privateSettings, findableMessages);
      } else {
        this.hullClient.logger.info("Skipping sending events. Event identifiers not defined.");
      }
    }
    return entitiesSent;
  }

  async sendUsers(messages: Array<THullUserUpdateMessage>): Promise<*> {
    let sfEntities = null;
    try {
      sfEntities = await this.findSalesforceEntities(messages, ["lead", "contact", "account"]);
    } catch (error) {
      return this.handleError(error);
    }

    if (_.isNil(sfEntities)) {
      sfEntities = {
        sfLeads: [],
        sfContacts: [],
        sfAccounts: []
      };
    }

    const { sfLeads = [], sfContacts = [], sfAccounts = [] } = sfEntities;
    this.log({ sfLeads, sfContacts, sfAccounts }, messages);
    if (sfLeads.length === 10000 || sfContacts.length === 10000 || sfAccounts.length === 1000) {
      return Promise.resolve();
    }

    const envelopes = this.buildEnvelopes(messages, sfEntities);

    const accountsToUpsert = this.filterUtil.filterAccounts(envelopes, "user", this.isBatch);
    return Promise.resolve(
      this.sendEntity("account", "Account", envelopes, _.pick(accountsToUpsert, ["toInsert", "toUpdate"]))
    )
      .then(() => {
        return Promise.all([
          this.sendEntity("user", "Contact", envelopes, this.filterUtil.filterContacts(envelopes)),
          this.sendEntity("user", "Lead", envelopes, this.filterUtil.filterLeads(envelopes))
        ]);
      });
  }

  async sendAccounts(messages: Array<THullAccountUpdateMessage>): Promise<*> {
    let sfEntities = null;
    try {
      sfEntities = await this.findSalesforceEntities(messages, ["account"]);
    } catch (error) {
      return this.handleError(error);
    }
    if (_.isNil(sfEntities)) {
      sfEntities = {
        sfAccounts: []
      };
    }
    const { sfAccounts = [] } = sfEntities;
    if (sfAccounts.length === 1000) {
      return Promise.resolve();
    }

    const envelopes = this.buildEnvelopes(messages, sfEntities);

    return Promise.resolve(
      this.sendEntity("account", "Account", _.compact(envelopes), this.filterUtil.filterAccounts(envelopes, "account", this.isBatch))
    );
  }

  async sendEntity(hullEntityType: string, resourceType: TResourceType, envelopes: Array<Object>, filtered: Object): Promise<*> {
    let schema = {};
    const {
      toInsert,
      toUpdate,
      toSkip
    } = filtered;

    if (!_.isEmpty(toInsert) || !_.isEmpty(toUpdate)) {
      schema = await getResourceSchema(resourceType, { fetchResourceSchema: this.fetchResourceSchema, cache: this.cache, serviceClient: this.sf });
    }

    _.forEach(toSkip, (envelope) => {
      const skipReason = {};
      _.set(skipReason, "reason", _.get(envelope, "skipReason", ""));
      if (hullEntityType === "user") {
        _.set(skipReason, `sf_${resourceType.toLowerCase()}_data`, _.get(envelope, `currentSf${resourceType}`, {}));
        this.hullClient.asUser(envelope.message.user).logger.info(`outgoing.${hullEntityType}.skip`, skipReason);
      }
      if (hullEntityType === "account") {
        this.hullClient.asAccount(envelope.message.account).logger.info(`outgoing.${hullEntityType}.skip`, skipReason);
      }
    });

    const sfObjectsToInsert = [];
    _.forEach(toInsert, (envelope) => {
      const userSegments = hullEntityType === "user" ? _.get(envelope, "message.segments", []) : [];
      const accountSegments = _.get(envelope, "message.account_segments", []);
      const sfObject = this.attributesMapper.mapToServiceObject(resourceType, _.get(envelope.message, hullEntityType), userSegments, accountSegments);

      sfObjectsToInsert.push(sfObject);
    });

    const sfObjectsToUpdate = [];
    _.forEach(toUpdate, (envelope) => {
      const hullEntity = _.get(envelope.message, hullEntityType, {});
      const asHullEntity = resourceType === "Account" ? this.hullClient.asAccount(hullEntity) : this.hullClient.asUser(hullEntity);
      const userSegments = hullEntityType === "user" ? _.get(envelope, "message.segments", []) : [];
      const accountSegments = _.get(envelope, "message.account_segments", []);

      const sfObject = this.attributesMapper.mapToServiceObject(resourceType, hullEntity, userSegments, accountSegments);
      const patch = this.patchUtil.createPatchObject(resourceType, sfObject, _.get(envelope, `currentSf${resourceType}`), schema);

      if (patch.hasChanges) {
        sfObjectsToUpdate.push(patch.patchObject);
      } else {
        asHullEntity
          .logger
          .info(`outgoing.${hullEntityType}.skip`, { reason: `The ${resourceType.toLowerCase()} in Salesforce is already in sync with Hull.` });
      }
    });

    return Promise.all([
      this.insertSfObject(hullEntityType, resourceType, sfObjectsToInsert, schema, envelopes),
      this.updateSfObject(hullEntityType, resourceType, sfObjectsToUpdate, schema, envelopes)
    ]).spread((inserted, updated) => {
      return {
        inserted,
        updated
      };
    });
  }

  async insertSfObject(hullEntityType: string, resourceType: TResourceType, records: Array<THullObject>, schema: Object, envelopes: Array<Object>): Promise<*> {
    let sfObjectsInserted = [];

    if (!_.isEmpty(records)) {
      try {
        sfObjectsInserted = await this.sf.insert(records, {
          leadAssignmentRule: this.leadAssignmentRuleOnCreate,
          resource: resourceType
        });

        if (!_.isNil(sfObjectsInserted) && !_.isEmpty(sfObjectsInserted)) {
          await this.resolveHullEntities(schema, sfObjectsInserted, envelopes, hullEntityType);
        }
      } catch (error) {
        this.hullClient.logger.error("outgoing.job.error", {
          error,
          errorMessage: _.isFunction(error.toString) ? error.toString() : "Unknown error."
        });
        records.forEach((sfObject) => {
          const hullIdentity = this.attributesMapper.mapToHullIdentObject(resourceType, sfObject);
          const asHullEntity = resourceType === "Account" ? this.hullClient.asAccount(hullIdentity) : this.hullClient.asUser(hullIdentity);
          asHullEntity
            .logger
            .info(`outgoing.${hullEntityType}.error`, {
              error: `At least one outgoing ${hullEntityType} in the batch has failed: ${_.isFunction(error.toString) ? error.toString() : "Unknown error."}`,
              resourceType
            });
        });
      }
    }
    return Promise.resolve(sfObjectsInserted);
  }

  async updateSfObject(hullEntityType: string, resourceType: TResourceType, records: Array<THullObject>, schema: Object, envelopes: Array<Object>): Promise<*> {
    let sfObjectsUpdated = [];

    if (!_.isEmpty(records)) {
      try {
        sfObjectsUpdated = await this.sf.update(records, {
          leadAssignmentRule: this.leadAssignmentRuleOnUpdate,
          resource: resourceType
        });

        if (!_.isNil(sfObjectsUpdated) && !_.isEmpty(sfObjectsUpdated)) {
          await this.resolveHullEntities(schema, sfObjectsUpdated, envelopes, hullEntityType);
        }
      } catch (error) {
        this.hullClient.logger.error("outgoing.job.error", {
          error,
          errorMessage: _.isFunction(error.toString) ? error.toString() : "Unknown error."
        });
        records.forEach((sfObject) => {
          let matchingEnvelopes = [];

          if (resourceType === "Account") {
            matchingEnvelopes = _.filter(envelopes, (envelope) => {
              return _.get(envelope, "message.account.salesforce/id") === sfObject.Id;
            });

            const matchingEnvelope = matchingEnvelopes.length > 0 ? matchingEnvelopes[0] : null;

            if (!_.isNil(matchingEnvelope)) {
              // eslint-disable-next-line
              const accountIdentity = IdentityUtil.getEntityIdentity(matchingEnvelope.message.account, sfObject, resourceType, this.hullClient);

              this.hullClient.asAccount(accountIdentity)
                .logger
                .info(`outgoing.${hullEntityType}.error`, {
                  error: `At least one outgoing ${hullEntityType} in the batch has failed: ${_.isFunction(error.toString) ? error.toString() : "Unknown error."}`,
                  resourceType
                });
            }
          } else {
            const hullIdentity = this.attributesMapper.mapToHullIdentObject(resourceType, sfObject);
            const asHullEntity = resourceType === "Account" ? this.hullClient.asAccount(hullIdentity) : this.hullClient.asUser(hullIdentity);
            asHullEntity
              .logger
              .info(`outgoing.${hullEntityType}.error`, {
                error: `At least one outgoing ${hullEntityType} in the batch has failed: ${_.isFunction(error.toString) ? error.toString() : "Unknown error."}`,
                resourceType
              });
          }
        });
      }
    }
    return Promise.resolve(sfObjectsUpdated);
  }

  async resolveHullEntities(resourceSchema: Object, sfObjects: IApiResultObject[], envelopes: IAccountUpdateEnvelope[] | IUserUpdateEnvelope[], hullEntityType: string): Promise<*> {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < _.size(sfObjects); i++) {
      const sfObject = sfObjects[i];
      const resourceType = sfObject.resource;
      const currentObjectPropertyName = `currentSf${resourceType}.Id`;
      let matchingEnvelopes = [];
      let claims = [];
      if (resourceType === "Contact" || resourceType === "Lead") {
        claims = this.userClaims;
      } else if (resourceType === "Account") {
        claims = this.accountClaims;
      }

      const findBy = {};

      _.set(findBy, currentObjectPropertyName, sfObject.record.Id);

      let matchingEnvelope = _.find(envelopes, findBy);

      if (!matchingEnvelope && resourceType === "Account") {
        matchingEnvelopes = _.filter(envelopes, (envelope) => {
          return _.get(envelope, "message.account.salesforce/id") === sfObject.record.Id;
        });
      }

      if (!matchingEnvelope) {
        const identityClaims = this.matchUtil.getMatchingEnvelopes(envelopes, claims, sfObject, hullEntityType);
        matchingEnvelopes = this.matchUtil.resolveSalesForceEnvelopeIdentityClaims(claims, identityClaims);

        if (matchingEnvelopes.length > 0) {
          matchingEnvelope = matchingEnvelopes[0];
        }
      }

      if (matchingEnvelope) {
        if (resourceType === "Contact" || resourceType === "Lead") {
          const userIdentity = IdentityUtil.getEntityIdentity(matchingEnvelope.message.user, sfObject.record, sfObject.resource, this.hullClient);
          const asUser = this.hullClient.asUser(userIdentity);

          if (sfObject.success) {
            asUser.logger.info("outgoing.user.success", {
              record: sfObject.record,
              operation: sfObject.method,
              resource: sfObject.resource
            });

            // eslint-disable-next-line no-await-in-loop
            const userTraits = await this.attributesMapper.mapToHullAttributeObject(sfObject.resource, sfObject.record, resourceSchema);
            asUser.traits(userTraits);
            _.set(matchingEnvelope.message.user, `salesforce_${sfObject.resource.toLowerCase()}/id`, sfObject.record.Id);
          } else {
            this.hullClient.asUser(matchingEnvelope.message.user)
              .logger
              .info("outgoing.user.error", {
                error: sfObject.error,
                data: sfObject.record
              });
          }
        }
        if (resourceType === "Account") {
          if (sfObject.success) {
            const accountIdentity = IdentityUtil.getEntityIdentity(matchingEnvelope.message.account, sfObject.record, sfObject.resource, this.hullClient);
            const asAccount = this.hullClient.asAccount(accountIdentity);

            asAccount.logger.info("outgoing.account.success", {
              record: sfObject.record,
              operation: sfObject.method,
              resource: sfObject.resource
            });
            // eslint-disable-next-line no-await-in-loop
            const accountTraits = await this.attributesMapper.mapToHullAttributeObject(sfObject.resource, sfObject.record, resourceSchema);
            asAccount.traits(accountTraits);

            matchingEnvelopes.forEach((me) => {
              if (!_.isEmpty(me.message.user)) {
                _.set(me.message.user, "salesforce_contact/account_id", sfObject.record.Id);
              }
              _.set(me.message.account, "salesforce/id", sfObject.record.Id);
            });
          } else {
            this.hullClient.asAccount(matchingEnvelope.message.account).logger.info("outgoing.account.error", {
              error: sfObject.error,
              data: sfObject.record
            });
          }
        }
      }
    }
    return Promise.resolve();
  }

  buildFindQuery(messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>, resourceType: string): Object {
    const hullEntityType = _.includes(["lead", "contact"], resourceType) ? "user" : "account";
    const queryOpts = this.queryUtil.buildQueryOpts(resourceType, this.accountClaims);
    return this.queryUtil.composeFindQuery(messages, queryOpts, hullEntityType);
  }

  findSalesforceEntities(messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>, salesforceEntityTypes: Array<string>) {
    const queries = {};
    const fetchFields = {};

    _.forEach(salesforceEntityTypes, (resourceType) => {
      const fields = this.queryUtil.composeFindFields(_.upperFirst(resourceType), this.mappings);

      if (resourceType === "account") {
        _.forEach(this.accountClaims, (accountClaim) => {
          if (!_.includes(fields, accountClaim.service)) {
            fields.push(accountClaim.service);
          }
        });
      }

      _.set(queries, resourceType, this.buildFindQuery(messages, resourceType));
      _.set(fetchFields, resourceType, fields);
    });

    return Promise.all([
      this.sf.findLeads(queries.lead, fetchFields.lead),
      this.sf.findContacts(queries.contact, fetchFields.contact),
      this.sf.findAccounts(queries.account, fetchFields.account)
    ])
      .spread((sfLeads, sfContacts, sfAccounts) => {
        this.log({ sfLeads, sfContacts, sfAccounts }, messages);
        if (sfLeads.length === 10000 || sfContacts.length === 10000 || sfAccounts.length === 1000) {
          return Promise.resolve({});
        }
        return { sfLeads, sfContacts, sfAccounts };
      });
  }

  buildEnvelopes(messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>, sfEntities: Object) {
    const { sfAccounts = [], sfContacts = [], sfLeads = [] } = sfEntities;
    return messages.map((message: THullUserUpdateMessage): IUserUpdateEnvelope => {
      const envelope: IUserUpdateEnvelope = {
        message
      };

      if (!_.isEmpty(sfAccounts)) {
        this.matchUtil.matchAccounts(envelope, sfAccounts, this.accountClaims, "user");
      }

      if (!_.isEmpty(sfContacts)) {
        this.matchUtil.matchUsers("Contact", envelope, sfContacts);
      }

      if (!_.isEmpty(sfLeads)) {
        this.matchUtil.matchUsers("Lead", envelope, sfLeads);
      }

      return envelope;
    });
  }

  // TODO handle logging correctly
  log(entities: Object, messages: Array<Object>) {
    const { sfLeads = [], sfContacts = [], sfAccounts = [] } = entities;
    if (sfLeads.length === 10000 || sfContacts.length === 10000 || sfAccounts.length === 1000) {
      this.hullClient.logger.error("outgoing.job.error", {
        error: "Found hard limit hit, we cannot match objects",
        sfLeads: sfLeads.length,
        sfContacts: sfContacts.length,
        sfAccounts: sfAccounts.length,
        userIds: this.queryUtil.extractUniqueValues(messages, "user.id"),
        userEmails: this.queryUtil.extractUniqueValues(messages, "user.email"),
        accountDomains: this.queryUtil.extractUniqueValues(messages, "account.domain"),
      });
    }

    this.hullClient.logger.debug("outgoing.job.progress", {
      step: "findResults",
      sfLeads: sfLeads.length,
      sfContacts: sfContacts.length,
      sfAccounts: sfAccounts.length,
      userIds: this.queryUtil.extractUniqueValues(messages, "user.id"),
      userEmails: this.queryUtil.extractUniqueValues(messages, "user.email"),
      accountDomains: this.queryUtil.extractUniqueValues(messages, "account.domain"),
    });
  }


  handleError(error: any): Promise<*> {
    const errorName = _.get(error, "name", "");
    const errorMessage = _.get(error, "message", "");

    const errorTemplate = _.find(errors, (err) => {
      return err.name === errorName && (_.isNil(err.message) || errorMessage.includes(err.message));
    });

    if (!_.isNil(errorTemplate)) {
      this.hullClient.logger.error("outgoing.job.error", { error: errorName, details: errorMessage });
      return Promise.resolve({});
    }

    this.hullClient.logger.error("outgoing.job.error", { error: "Unknown API error", name: errorName, details: errorMessage });
    throw error;
  }
}

module.exports = SyncAgent;
