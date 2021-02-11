// @flow

import type { THullAccountUpdateMessage, THullUserUpdateMessage } from "hull";
import type { HullContext } from "hull/src/types/context";
import type {
  IAttributesMapper,
  IConnectionOptions,
  IOauth2Credentials,
  ISalesforceClientOptions,
  IServiceClient,
  IUserUpdateEnvelope,
  THullObject,
  TResourceType
} from "./types";

const _ = require("lodash");
const camelize = require("camelize");
const Promise = require("bluebird");

const { getMappings } = require("./sync-agent/mapping-util");
const PatchUtil = require("./sync-agent/patch-util");
const { AttributesMapper } = require("./sync-agent/attributes-mapper");
const FilterUtil = require("./sync-agent/filter-util");
const QueryUtil = require("./sync-agent/query-util");
const MatchUtil = require("./sync-agent/match-util");
const IdentityUtil = require("./utils/identity-utils");
const SalesforceClient = require("./service-client");
const { errors } = require("./errors");
const { RELATED_ENTITY_MAPPING } = require("./sync-agent/mappings");
const { getFieldsSchema } = require("./utils/get-fields-schema");

function createConnectionOptions(
  ship: Object,
  oauth2: IOauth2Credentials
): IConnectionOptions {
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

  sf: IServiceClient;

  fetchResourceSchema: boolean;

  fetchAccounts: boolean;

  linkAccounts: boolean;

  leadAssignmentRuleOnCreate: string;

  leadAssignmentRuleOnUpdate: string;

  mappings: Object;

  accountClaims: Array<Object>;

  contactClaims: Array<Object>;

  filterUtil: FilterUtil;

  queryUtil: QueryUtil;

  matchUtil: MatchUtil;

  requireEmail: boolean;

  privateSettings: Object;

  cache: Object;

  isBatch: boolean;

  asEntity: any;

  source: string;

  ctx: HullContext;

  constructor(ctx: HullContext) {
    const { client, cache, metric } = ctx;
    const connector = _.get(ctx, "connector") || _.get(ctx, "ship");
    const { private_settings } = connector;

    this.ctx = ctx;
    this.cache = cache;
    this.source = _.toLower(private_settings.source || "salesforce");
    this.fetchAccounts = private_settings.fetch_accounts;
    this.linkAccounts = private_settings.link_accounts || false;
    this.fetchResourceSchema = private_settings.fetch_resource_schema || false;
    this.leadAssignmentRuleOnCreate =
      connector.private_settings.lead_assignmentrule;
    this.leadAssignmentRuleOnUpdate =
      private_settings.lead_assignmentrule_update;
    this.requireEmail = private_settings.ignore_users_withoutemail || false;
    this.mappings = getMappings(connector);
    this.isBatch = _.get(ctx.notification, "is_export", false);
    this.accountClaims = private_settings.account_claims || [];
    this.contactClaims = private_settings.contact_claims || [];
    this.leadClaims = private_settings.lead_claims || [];

    this.privateSettings = private_settings;
    this.hullClient = client;
    this.metric = metric;
    const clntOpts: ISalesforceClientOptions = {
      connection: createConnectionOptions(
        connector,
        connector.private_settings.oauth2
      ),
      logger: this.hullClient.logger,
      metrics: this.metric
    };
    this.sf = new SalesforceClient(clntOpts);
    this.patchUtil = new PatchUtil(private_settings, this.isBatch);
    this.attributesMapper = new AttributesMapper({
      ...private_settings,
      source: this.source
    });
    this.filterUtil = new FilterUtil(private_settings);
    this.queryUtil = new QueryUtil();
    this.matchUtil = new MatchUtil();
    this.asEntity = () => {};

    this.sf.on("refresh", (accessToken, res) => {
      this.hullClient.logger.debug("connector.sfClient.refresh", {
        accessToken,
        res
      });
    });
  }

  getIdentityClaims({ sfType }) {
    if (_.toLower(sfType) === "task") {
      return this.contactClaims;
    }
    return this[`${_.toLower(sfType)}Claims`] || [];
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
        return getFieldsSchema(this.sf, ["Contact", "Task", "Lead", "Account"]);
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

  enrichMessages(
    hullType: string,
    messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>
  ) {
    _.forEach(messages, message => {
      if (hullType === "user") {
        const account = _.get(message, "account", {});
        _.set(message.user, "account", account);
      }
    });
  }

  async sendContactMessages(
    messages: Array<THullUserUpdateMessage>
  ): Promise<*> {
    this.asEntity = this.hullClient.asUser;
    this.enrichMessages("user", messages);

    const filteredMessages = this.filterUtil.filterMessages(
      "Contact",
      messages,
      this.isBatch
    );

    await this.sendMessages(filteredMessages, {
      hullType: "account",
      resourceType: "Account"
    });
    return this.sendMessages(filteredMessages, {
      hullType: "user",
      resourceType: "Contact"
    });
  }

  async sendLeadMessages(messages: Array<THullUserUpdateMessage>): Promise<*> {
    this.asEntity = this.hullClient.asUser;
    this.enrichMessages("user", messages);

    const filteredMessages = this.filterUtil.filterMessages(
      "Lead",
      messages,
      this.isBatch
    );

    return this.sendMessages(filteredMessages, {
      hullType: "user",
      resourceType: "Lead"
    });
  }

  async sendAccountMessages(
    messages: Array<THullAccountUpdateMessage>
  ): Promise<*> {
    this.asEntity = this.hullClient.asAccount;

    const filteredMessages = this.filterUtil.filterMessages(
      "Account",
      messages,
      this.isBatch
    );

    return this.sendMessages(filteredMessages, {
      hullType: "account",
      resourceType: "Account"
    });
  }

  async sendMessages(
    messages: Array<THullUserUpdateMessage>,
    { hullType, resourceType }
  ): Promise<*> {
    if (_.isEmpty(messages)) {
      return Promise.resolve({});
    }
    let sfEntities = {};
    try {
      sfEntities = await this.findSalesforceEntities(messages, [resourceType]);
    } catch (error) {
      return this.handleError(error);
    }

    const envelopes = this.buildEnvelopes(messages, sfEntities);

    return this.sendToSalesforce(
      hullType,
      resourceType,
      envelopes,
      this.filterUtil.filterEnvelopes(envelopes, resourceType, this.isBatch)
    );
  }

  buildSalesforceObjects(
    envelopes: Object,
    resourceType: TResourceType,
    schema: Object
  ): Object {
    const { toInsert, toUpdate } = envelopes;

    const sfObjectsInSync = [];
    const sfObjectsToInsert = [];
    const sfObjectsToUpdate = [];

    _.forEach(toInsert, envelope => {
      const { message } = envelope;
      const { user, account } = message;
      const hullEntity = resourceType === "Account" ? account : user;
      const userSegments = _.get(message, "segments", []);
      const accountSegments = _.get(message, "account_segments", []);
      const sfObject = this.attributesMapper.mapToServiceObject(
        resourceType,
        hullEntity,
        userSegments,
        accountSegments
      );

      sfObjectsToInsert.push(sfObject);
    });

    _.forEach(toUpdate, envelope => {
      const { message } = envelope;
      const { user, account, changes } = message;
      const hullEntity = resourceType === "Account" ? account : user;
      const userSegments = _.get(message, "segments", []);
      const accountSegments = _.get(message, "account_segments", []);

      const sfObject = this.attributesMapper.mapToServiceObject(
        resourceType,
        hullEntity,
        userSegments,
        accountSegments
      );

      const patch = this.patchUtil.createPatchObject(
        resourceType,
        sfObject,
        _.get(envelope, `matches.${_.toLower(resourceType)}[0]`),
        schema,
        changes
      );

      if (patch.hasChanges) {
        sfObjectsToUpdate.push(patch.patchObject);
      } else {
        _.set(
          envelope.skip,
          _.toLower(resourceType),
          `The ${_.toLower(
            resourceType
          )} in Salesforce is already in sync with Hull.`
        );
        sfObjectsInSync.push({
          envelope,
          hullType: resourceType === "Account" ? "account" : "user"
        });
      }
    });

    return {
      sfObjectsInSync,
      sfObjectsToInsert,
      sfObjectsToUpdate
    };
  }

  async sendToSalesforce(
    hullType: string,
    resourceType: TResourceType,
    envelopes: Array<Object>,
    filtered: Object
  ): Promise<*> {
    let schema = {};
    const { toInsert, toUpdate, toSkip } = filtered;

    if (!_.isEmpty(toInsert) || !_.isEmpty(toUpdate)) {
      schema = await this.getResourceSchema(resourceType);
    }

    const {
      sfObjectsInSync,
      sfObjectsToUpdate,
      sfObjectsToInsert
    } = this.buildSalesforceObjects(
      { toInsert, toUpdate },
      resourceType,
      schema
    );

    const skippedMessages = [...toSkip, ...sfObjectsInSync];
    if (!_.isEmpty(skippedMessages)) {
      this.logSkip(skippedMessages, resourceType);
    }

    let upsertedSfEntities = [];
    try {
      upsertedSfEntities = await Promise.all([
        this.insertSfObject(resourceType, sfObjectsToInsert),
        this.updateSfObject(resourceType, sfObjectsToUpdate)
      ]).spread(async (inserted, updated) => {
        return [...inserted, ...updated];
      });
    } catch (error) {
      // outgoing job error
      // TODO call this.handlerError(...);
      const asEntity =
        resourceType === "Account"
          ? this.hullClient.asAccount
          : this.hullClient.asUser;
      const toUpsert = [...toInsert, ...toUpdate];

      const promises = [];
      for (let i = 0; i < _.size(toUpsert); i += 1) {
        const { message } = toUpsert[i];
        const hullEntity = _.get(message, hullType);
        promises.push(
          asEntity(hullEntity).logger.info(`outgoing.${hullType}.error`, {
            error: `Outgoing Batch Error: ${
              _.isFunction(error.toString) ? error.toString() : "Unknown error."
            }`,
            warning: `Unable to determine invalid ${hullType}`,
            resourceType
          })
        );
      }
      return Promise.all(promises);
    }

    const messages = _.map(
      _.filter(envelopes, envelope =>
        _.isNil(envelope.skip[_.toLower(resourceType)])
      ),
      "message"
    );

    const promises = [];
    for (let i: number = 0; i < _.size(upsertedSfEntities); i += 1) {
      const sfEntity = upsertedSfEntities[i];
      const matchedMessages = this.getMatchingMessages(
        messages,
        sfEntity,
        hullType,
        resourceType
      );

      promises.push(
        this.save(
          {
            hullType,
            sfType: resourceType,
            source: "hull",
            method: sfEntity.method,
            error: sfEntity.error,
            success: sfEntity.success
          },
          sfEntity.record,
          matchedMessages[0]
        )
      );

      if (!sfEntity.success) {
        this.hullClient.logger.info(`outgoing.${hullType}.error`, {
          error: sfEntity.error,
          data: sfEntity.record,
          warning: `Unable to determine Hull ${hullType} identity`
        });
      }

      if (sfEntity.success && sfEntity.record.Id) {
        if (hullType === "account") {
          _.forEach(matchedMessages, message => {
            const { user, account } = message;
            if (!_.isEmpty(user)) {
              _.set(
                user,
                `${this.source}_contact/account_id`,
                sfEntity.record.Id
              );
            }
            _.set(account, `${this.source}/id`, sfEntity.record.Id);
          });
        } else if (!_.isEmpty(matchedMessages)) {
          const { user } = matchedMessages[0];
          _.set(
            user,
            `${this.source}_${_.toLower(resourceType)}/id`,
            sfEntity.record.Id
          );
        }
      }
    }
    return Promise.all(promises);
  }

  getMatchingMessages(messages, sfEntity, hullType, resourceType) {
    const identityClaims = this.getIdentityClaims({
      sfType: resourceType
    });

    if (_.size(messages) === 1) {
      return messages;
    }

    const findBy =
      hullType === "account"
        ? _.set({}, `account.${this.source}/id`, sfEntity.record.Id)
        : _.set(
            {},
            `user.${this.source}_${_.toLower(resourceType)}/id`,
            sfEntity.record.Id
          );

    let matchedMessages = _.filter(messages, findBy);

    if (_.isNil(matchedMessages) || _.isEmpty(matchedMessages)) {
      const identityClaimMatches = this.matchUtil.getIdentityClaimMatches({
        entities: messages,
        identityClaims,
        searchEntity: sfEntity,
        searchType: "salesforce"
      });
      matchedMessages = this.matchUtil.filterIdentityClaimMatches({
        identityClaims,
        identityClaimMatches,
        intersectBy: { path: "message_id" }
      });
    }
    return matchedMessages;
  }

  buildFindQuery(
    messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>,
    resourceType: string,
    identityClaims: Array<Object>
  ): Object {
    const hullType = _.toLower(resourceType) === "account" ? "account" : "user";
    const queryOpts = this.queryUtil.buildQueryOpts({
      sfType: resourceType,
      params: identityClaims,
      source: this.source
    });
    return this.queryUtil.composeFindQuery(messages, queryOpts, hullType);
  }

  findSalesforceEntities(
    messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>,
    salesforceEntityTypes: Array<string>
  ) {
    const queries = {};
    const fetchFields = {};

    _.forEach(salesforceEntityTypes, resourceType => {
      const identityClaims = this.getIdentityClaims({
        sfType: _.toLower(resourceType)
      });

      const fields = this.queryUtil.composeFindFields(
        _.upperFirst(resourceType),
        this.mappings
      );

      _.forEach(identityClaims, claim => {
        if (!_.includes(fields, claim.service)) {
          fields.push(claim.service);
        }
      });

      _.set(
        queries,
        _.toLower(resourceType),
        this.buildFindQuery(messages, _.toLower(resourceType), identityClaims)
      );
      _.set(fetchFields, _.toLower(resourceType), fields);
    });

    return Promise.all([
      this.sf.findLeads(queries.lead, fetchFields.lead),
      this.sf.findContacts(queries.contact, fetchFields.contact),
      this.sf.findAccounts(queries.account, fetchFields.account)
    ]).spread((sfLeads, sfContacts, sfAccounts) => {
      if (
        sfLeads.length === 10000 ||
        sfContacts.length === 10000 ||
        sfAccounts.length === 1000
      ) {
        return Promise.reject(
          new Error("Found hard limit hit, we cannot match objects")
        );
      }
      return { sfLeads, sfContacts, sfAccounts };
    });
  }

  buildEnvelopes(
    messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>,
    sfEntities: Object
  ) {
    const { sfAccounts = [], sfContacts = [], sfLeads = [] } = sfEntities;
    return messages.map(
      (message: THullUserUpdateMessage): IUserUpdateEnvelope => {
        const matches = {
          account: [],
          contact: [],
          lead: []
        };

        const { user, account } = message;
        if (!_.isEmpty(sfAccounts)) {
          const accountMatches = this.matchUtil.matchHullMessageToSalesforceAccount(
            {
              message,
              sfAccounts,
              accountClaims: this.accountClaims,
              source: this.source
            }
          );
          const { primary, secondary } = accountMatches;

          if (!_.isEmpty(primary)) {
            matches.account = primary;
          } else {
            matches.account = secondary;
          }
        }

        if (!_.isEmpty(sfContacts)) {
          matches.contact = this.matchUtil.matchHullMessageToSalesforceRecord({
            resource: "Contact",
            user,
            sfObjects: sfContacts,
            identityClaims: this.contactClaims,
            source: this.source
          });
        }

        if (!_.isEmpty(sfLeads)) {
          matches.lead = this.matchUtil.matchHullMessageToSalesforceRecord({
            resource: "Lead",
            user,
            sfObjects: sfLeads,
            identityClaims: this.leadClaims,
            source: this.source
          });
        }

        _.map(matches, (sfObjects, resource) => {
          if (!_.isEmpty(sfObjects)) {
            const sfObject = _.isEmpty(sfObjects) ? {} : sfObjects[0];
            if (resource === "lead" || resource === "contact") {
              if (_.isEmpty(sfObject)) {
                _.unset(user, `${this.source}_${_.toLower(resource)}/id`);
              } else {
                _.set(
                  user,
                  `${this.source}_${_.toLower(resource)}/id`,
                  sfObject.Id
                );
              }
            }

            if (resource === "account") {
              if (_.isEmpty(sfObject)) {
                _.unset(account, `${this.source}/id`);
                _.unset(user, `${this.source}_contact/account_id`);
              } else {
                const sfAccountId = _.get(sfObject, "Id", "");

                if (!_.isEmpty(user)) {
                  const linkedAccountId = _.get(
                    user,
                    `${this.source}_contact/account_id`,
                    null
                  );
                  if (_.isNil(linkedAccountId)) {
                    _.set(
                      user,
                      `${this.source}_contact/account_id`,
                      sfAccountId
                    );
                  }
                }
                _.set(account, `${this.source}/id`, sfAccountId);
              }
            }
          }
        });
        return {
          message,
          matches,
          skip: {}
        };
      }
    );
  }

  async linkIncomingAccount(asEntity: any, sfObject): Promise<*> {
    const accountIdentity = {
      anonymous_id: `${this.source}:${sfObject.AccountId}`
    };
    return asEntity
      .account(accountIdentity)
      .traits({
        [`${this.source}/id`]: sfObject.AccountId
      })
      .then(() => {
        asEntity.logger.info("incoming.account.link.success");
      })
      .catch(err => {
        asEntity.logger.error("incoming.account.link.error", { error: err });
      });
  }

  async insertSfObject(
    resourceType: TResourceType,
    records: Array<THullObject>
  ): Promise<*> {
    if (!_.isEmpty(records)) {
      return this.sf.insert(records, {
        leadAssignmentRule: this.leadAssignmentRuleOnCreate,
        resource: resourceType
      });
    }
    return Promise.resolve([]);
  }

  async updateSfObject(
    resourceType: TResourceType,
    records: Array<THullObject>
  ): Promise<*> {
    if (!_.isEmpty(records)) {
      return this.sf.update(records, {
        leadAssignmentRule: this.leadAssignmentRuleOnCreate,
        resource: resourceType
      });
    }
    return Promise.resolve([]);
  }

  async getResourceSchema(type: string): Object {
    const fieldTypes = ["multipicklist"];

    if (!this.fetchResourceSchema) {
      return {};
    }

    let resourceSchema = await this.cache.get(`${type.toLowerCase()}Schema`);
    if (_.isNil(resourceSchema)) {
      resourceSchema = await this.sf.fetchResourceSchema(type, fieldTypes);
      await this.cache.set(`${type.toLowerCase()}Schema`, resourceSchema, {
        ttl: 60000
      });
    }
    return resourceSchema;
  }

  async save(
    params: {
      hullType: string,
      sfType: TResourceType,
      source: string,
      method: string,
      error: Object,
      success: boolean
    },
    sfObject: Object,
    message?: Object
  ): Promise<*> {
    const { hullType, sfType, source, method, error, success } = params;

    const identityClaims = this.getIdentityClaims({ sfType });

    const identity = _.isNil(message)
      ? this.attributesMapper.mapToHullIdentityObject(
          sfType,
          sfObject,
          identityClaims
        )
      : IdentityUtil.getEntityIdentity({
          hullEntity: _.get(message, hullType),
          sfEntity: sfObject,
          resource: sfType,
          hullClient: this.hullClient,
          source: this.source
        });

    const asEntity = this.hullClient[`as${_.upperFirst(hullType)}`](identity);

    const promises = [];

    const direction = source === "hull" ? "outgoing" : "incoming";
    const action = `${direction}.${hullType}`;

    const traits = this.attributesMapper.mapToHullAttributeObject(
      sfType,
      sfObject
    );

    if (source === "hull") {
      if (_.isEmpty(error) && success) {
        promises.push(asEntity.traits(traits));
        promises.push(
          asEntity.logger.info(`${action}.success`, {
            record: sfObject,
            operation: method,
            resource: sfType
          })
        );
      } else {
        promises.push(
          asEntity.logger.info(`${action}.error`, {
            error,
            data: sfObject
          })
        );
      }
    }

    return Promise.all(promises);
  }

  logSkip(skippedEnvelopes: Array<Object>, resourceType: TResourceType) {
    _.forEach(skippedEnvelopes, skipped => {
      const { envelope, hullType } = skipped;
      const skipReason = envelope.skip[_.toLower(resourceType)];
      if (!skipReason) {
        return;
      }
      const { user, account } = envelope.message;
      if (hullType === "user") {
        this.hullClient
          .asUser(user)
          .logger.info("outgoing.user.skip", { reason: skipReason });
      } else if (!_.has(user, "id")) {
        this.hullClient
          .asAccount(account)
          .logger.info("outgoing.account.skip", {
            reason: skipReason
          });
      }
    });
  }

  handleError(error: any): Promise<*> {
    const errorName = _.get(error, "name", "");
    const errorMessage = _.get(error, "message", "");

    const errorTemplate = _.find(errors, err => {
      return (
        err.name === errorName &&
        (_.isNil(err.message) || errorMessage.includes(err.message))
      );
    });

    if (!_.isNil(errorTemplate)) {
      this.hullClient.logger.error("outgoing.job.error", {
        error: errorName,
        details: errorMessage
      });
      return Promise.resolve({});
    }

    this.hullClient.logger.error("outgoing.job.error", {
      error: "API error",
      name: errorName,
      details: errorMessage
    });
    throw error;
  }
}

module.exports = SyncAgent;
