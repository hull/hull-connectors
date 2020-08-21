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

  userClaims: Array<Object>;

  filterUtil: FilterUtil;

  queryUtil: QueryUtil;

  matchUtil: MatchUtil;

  requireEmail: boolean;

  privateSettings: Object;

  cache: Object;

  isBatch: boolean;

  asEntity: any;

  ctx: HullContext;

  constructor(ctx: HullContext) {
    const { client, cache, metric } = ctx;
    const connector = _.get(ctx, "connector") || _.get(ctx, "ship");
    const { private_settings } = connector;

    this.ctx = ctx;
    this.cache = cache;
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
    this.userClaims = private_settings.user_claims || [];
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
    this.patchUtil = new PatchUtil(private_settings);
    this.attributesMapper = new AttributesMapper(private_settings);
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
    switch (_.toLower(sfType)) {
      case "account": {
        return this.accountClaims;
      }

      case "contact": {
        return this.userClaims;
      }

      case "lead": {
        return this.leadClaims;
      }

      case "task": {
        return this.userClaims;
      }

      default:
        return [];
    }
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

  async sendUserMessages(messages: Array<THullUserUpdateMessage>): Promise<*> {
    this.asEntity = this.hullClient.asUser;
    this.enrichMessages("user", messages);
    return this.sendMessages("user", messages);
  }

  async sendAccountMessages(
    messages: Array<THullAccountUpdateMessage>
  ): Promise<*> {
    this.asEntity = this.hullClient.asAccount;
    return this.sendMessages("account", messages);
  }

  async sendMessages(
    hullType: string,
    messages: Array<THullAccountUpdateMessage>
  ): Promise<*> {
    const dedupedMessages = this.filterUtil.filterDuplicateMessages(
      messages,
      hullType
    );
    const findableMessages = this.filterUtil.filterFindableMessages(
      hullType,
      dedupedMessages,
      this.isBatch
    );

    if (findableMessages.length === 0) {
      dedupedMessages.forEach(message => {
        // eslint-disable-next-line
        this.asEntity(_.get(message, hullType)).logger.debug(`outgoing.${hullType}.skip`, { reason: `No valid ${hullType} messages to send` });
      });
      return Promise.resolve({});
    }
    return hullType === "account"
      ? this.sendAccounts(dedupedMessages)
      : this.sendUsers(dedupedMessages);
  }

  async sendUsers(messages: Array<THullUserUpdateMessage>): Promise<*> {
    let sfEntities = null;
    try {
      sfEntities = await this.findSalesforceEntities(messages, [
        "lead",
        "contact",
        "account"
      ]);
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
    if (
      sfLeads.length === 10000 ||
      sfContacts.length === 10000 ||
      sfAccounts.length === 1000
    ) {
      return Promise.resolve();
    }

    const envelopes = this.buildEnvelopes(messages, sfEntities);

    const filteredAccounts = this.filterUtil.filterAccountEnvelopes(
      envelopes,
      this.isBatch
    );
    return Promise.resolve(
      this.sendToSalesforce("account", "Account", envelopes, filteredAccounts)
    ).then(() => {
      return Promise.all([
        this.sendToSalesforce(
          "user",
          "Contact",
          envelopes,
          this.filterUtil.filterContactEnvelopes(envelopes)
        ),
        this.sendToSalesforce(
          "user",
          "Lead",
          envelopes,
          this.filterUtil.filterLeadEnvelopes(envelopes)
        )
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
      this.sendToSalesforce(
        "account",
        "Account",
        _.compact(envelopes),
        this.filterUtil.filterAccountEnvelopes(envelopes, this.isBatch)
      )
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
      const patch = this.patchUtil.createPatchObject(
        resourceType,
        sfObject,
        _.get(envelope, `matches.${_.toLower(resourceType)}[0]`),
        schema
      );

      if (patch.hasChanges) {
        sfObjectsToUpdate.push(patch.patchObject);
      } else {
        sfObjectsInSync.push({
          envelope,
          hullType: resourceType === "Account" ? "account" : "user",
          skipReason: `The ${_.toLower(
            resourceType
          )} in Salesforce is already in sync with Hull.`
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
    const identityClaims = this.getIdentityClaims({
      sfType: resourceType
    });

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
      this.logSkip(skippedMessages);
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
      let i = 0;
      for (i = 0; i < _.size(toUpsert); i += 1) {
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

    const messages = _.map(envelopes, "message");

    const promises = [];
    for (let i: number = 0; i < _.size(upsertedSfEntities); i += 1) {
      const sfEntity = upsertedSfEntities[i];

      const findBy =
        hullType === "account"
          ? _.set({}, "account.salesforce/id", sfEntity.record.Id)
          : _.set(
              {},
              `user.salesforce_${_.toLower(resourceType)}/id`,
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
              _.set(user, "salesforce_contact/account_id", sfEntity.record.Id);
            }
            _.set(account, "salesforce/id", sfEntity.record.Id);
          });
        } else if (!_.isEmpty(matchedMessages)) {
          const { user } = matchedMessages[0];
          _.set(
            user,
            `salesforce_${_.toLower(resourceType)}/id`,
            sfEntity.record.Id
          );
        }
      }
    }
    return Promise.all(promises);
  }

  buildFindQuery(
    messages: Array<THullUserUpdateMessage | THullAccountUpdateMessage>,
    resourceType: string,
    identityClaims: Array<Object>
  ): Object {
    const hullType = _.toLower(resourceType) === "account" ? "account" : "user";
    const queryOpts = this.queryUtil.buildQueryOpts(
      resourceType,
      identityClaims
    );
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
        sfType: resourceType
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
        resourceType,
        this.buildFindQuery(messages, resourceType, identityClaims)
      );
      _.set(fetchFields, resourceType, fields);
    });

    return Promise.all([
      this.sf.findLeads(queries.lead, fetchFields.lead),
      this.sf.findContacts(queries.contact, fetchFields.contact),
      this.sf.findAccounts(queries.account, fetchFields.account)
    ]).spread((sfLeads, sfContacts, sfAccounts) => {
      this.log({ sfLeads, sfContacts, sfAccounts }, messages);
      if (
        sfLeads.length === 10000 ||
        sfContacts.length === 10000 ||
        sfAccounts.length === 1000
      ) {
        return Promise.resolve({});
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
            message,
            sfAccounts,
            this.accountClaims
          );
          const { primary, secondary } = accountMatches;

          if (!_.isEmpty(primary)) {
            matches.account = primary;
          } else {
            matches.account = secondary;
          }
        }

        if (!_.isEmpty(sfContacts)) {
          matches.contact = this.matchUtil.matchHullMessageToSalesforceRecord(
            "Contact",
            user,
            sfContacts,
            this.userClaims
          );
        }

        if (!_.isEmpty(sfLeads)) {
          matches.lead = this.matchUtil.matchHullMessageToSalesforceRecord(
            "Lead",
            user,
            sfLeads,
            this.leadClaims
          );
        }

        _.map(matches, (sfObjects, resource) => {
          if (!_.isEmpty(sfObjects)) {
            const sfObject = _.isEmpty(sfObjects) ? {} : sfObjects[0];
            if (resource === "lead" || resource === "contact") {
              if (_.isEmpty(sfObject)) {
                _.unset(user, `salesforce_${_.toLower(resource)}/id`);
              } else {
                _.set(
                  user,
                  `salesforce_${_.toLower(resource)}/id`,
                  sfObject.Id
                );
              }
            }

            if (resource === "account") {
              if (_.isEmpty(sfObject)) {
                _.unset(account, "salesforce/id");
                _.unset(user, "salesforce_contact/account_id");
              } else {
                const sfAccountId = _.get(sfObject, "Id", "");

                if (!_.isEmpty(user)) {
                  const linkedAccountId = _.get(
                    user,
                    "salesforce_contact/account_id",
                    null
                  );
                  if (_.isNil(linkedAccountId)) {
                    _.set(user, "salesforce_contact/account_id", sfAccountId);
                  }
                }
                _.set(account, "salesforce/id", sfAccountId);
              }
            }
          }
        });
        return {
          message,
          matches
        };
      }
    );
  }

  async linkIncomingAccount(asEntity: any, sfObject): Promise<*> {
    this.hullClient.logger.debug("incoming.account.link", {
      user: this.attributesMapper.mapToHullIdentityObject(
        "Contact",
        sfObject,
        this.userClaims
      ),
      account: this.attributesMapper.mapToHullIdentityObject(
        "Account",
        sfObject.Account,
        this.accountClaims
      )
    });
    const accountIdentity = this.attributesMapper.mapToHullIdentityObject(
      "Account",
      sfObject.Account,
      this.accountClaims
    );
    return asEntity
      .account(accountIdentity)
      .traits({})
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

  async saveTask(params: Object, record: Object): Promise<*> {
    const promises = [];

    const serviceType = _.get(record, "attributes.type", null);
    const createdDate = _.get(record, "CreatedDate");
    const associatedType = _.get(record, "Who.Type", null);

    if (serviceType === null) {
      this.hullClient.logger.error("Salesforce object type not found");
      return Promise.resolve();
    }
    if (associatedType === null) {
      this.hullClient.logger.error(
        `Salesforce object [${JSON.stringify(
          record
        )}] not associated with a user or account entity`
      );
      return Promise.resolve();
    }

    const isValid = !!_.get(record, "WhoId") && !!_.get(record, "Subject");
    if (!isValid) {
      this.hullClient.logger.error(
        `Unable to save record ${_.get(record, "Id")}`
      );
      return Promise.resolve();
    }

    const anonymousId = `salesforce-${associatedType.toLowerCase()}:${_.get(
      record,
      "WhoId"
    )}`;

    const asUser = this.hullClient.asUser({ anonymous_id: anonymousId });

    const context = {};
    const event_id = `salesforce-${_.toLower(serviceType)}:${_.get(
      record,
      "Id"
    )}`;
    _.set(context, "source", "salesforce");
    _.set(context, "created_at", createdDate);
    _.set(context, "event_id", event_id);

    const taskType = _.get(record, "Type", null);
    let eventName = !_.isNil(taskType)
      ? `Salesforce Task:${taskType}`
      : "Salesforce Task";

    if (_.get(record, "IsDeleted", false)) {
      eventName = `DELETED - ${eventName}`;
    }

    const event = this.attributesMapper.mapToHullEvent(
      _.get(this.mappings, "Task"),
      serviceType,
      record
    );

    if (serviceType === "Task") {
      promises.push(
        asUser
          .track(eventName, event, context)
          .then(() => {
            asUser.logger.info("incoming.event.success", { event });
          })
          .catch(error => {
            asUser.logger.error("incoming.event.error", { error });
          })
      );
    }
    return Promise.all(promises);
  }

  async saveContact(
    params: {
      sfType: TResourceType,
      source: string,
      method: string,
      error: Object
    },
    sfObject: Object,
    message?: Object
  ): Promise<*> {
    return this.save(
      {
        hullType: "user",
        ...params
      },
      sfObject,
      message
    );
  }

  async saveLead(
    params: {
      sfType: TResourceType,
      source: string,
      method: string,
      error: Object
    },
    sfObject: Object,
    message?: Object
  ): Promise<*> {
    return this.save(
      {
        hullType: "user",
        ...params
      },
      sfObject,
      message
    );
  }

  async saveAccount(
    params: {
      sfType: TResourceType,
      source: string,
      method: string,
      error: Object
    },
    sfObject: Object,
    message?: Object
  ): Promise<*> {
    return this.save(
      {
        hullType: "account",
        ...params
      },
      sfObject,
      message
    );
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
    const resourceSchema = await this.getResourceSchema(sfType);

    const identity = _.isNil(message)
      ? this.attributesMapper.mapToHullIdentityObject(
          sfType,
          sfObject,
          identityClaims
        )
      : IdentityUtil.getEntityIdentity(
          _.get(message, hullType),
          sfObject,
          sfType,
          this.hullClient
        );

    const asEntity = this.hullClient[`as${_.upperFirst(hullType)}`](identity);

    if (source === "salesforce") {
      for (let i = 0; i < _.size(identityClaims); i += 1) {
        const claim = identityClaims[i];
        if (
          claim.required === true &&
          _.get(sfObject, claim.service, "n/a") === "n/a"
        ) {
          return asEntity.logger.info(`incoming.${hullType}.skip`, {
            type: sfType,
            reason: `${sfType} is missing required claim ${claim.service}.`
          });
        }
      }

      // backwards compatible before claims settings
      if (
        hullType === "user" &&
        this.requireEmail &&
        _.get(sfObject, "Email", "n/a") === "n/a"
      ) {
        return asEntity.logger.info("incoming.user.skip", {
          type: "Contact",
          reason: "User has no email address and is not identifiable."
        });
      }
    }

    const promises = [];

    const direction = source === "hull" ? "outgoing" : "incoming";
    const action = `${direction}.${hullType}`;

    const traits =
      direction === "incoming" && sfObject.deletedDate
        ? this.attributesMapper.mapToHullDeletedObject(
            sfType,
            sfObject.deletedDate
          )
        : this.attributesMapper.mapToHullAttributeObject(
            sfType,
            sfObject,
            resourceSchema
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
    } else if (source === "salesforce") {
      promises.push(
        asEntity
          .traits(traits)
          .then(() => {
            return asEntity.logger.info(`${action}.success`, { traits });
          })
          .catch(err => {
            return asEntity.logger.error(`${action}.error`, { error: err });
          })
      );

      if (
        sfType === "Contact" &&
        sfObject.Account &&
        this.linkAccounts &&
        this.fetchAccounts &&
        this.accountClaims.length > 0 &&
        !_.isNil(_.get(sfObject.Account, this.accountClaims[0].service))
      ) {
        promises.push(this.linkIncomingAccount(asEntity, sfObject));
      }
    }

    return Promise.all(promises);
  }

  // TODO handle logging and errors correctly
  log(entities: Object, messages: Array<Object>) {
    const { sfLeads = [], sfContacts = [], sfAccounts = [] } = entities;
    if (
      sfLeads.length === 10000 ||
      sfContacts.length === 10000 ||
      sfAccounts.length === 1000
    ) {
      this.hullClient.logger.error("outgoing.job.error", {
        error: "Found hard limit hit, we cannot match objects",
        sfLeads: sfLeads.length,
        sfContacts: sfContacts.length,
        sfAccounts: sfAccounts.length,
        userIds: this.queryUtil.extractUniqueValues(messages, "user.id"),
        userEmails: this.queryUtil.extractUniqueValues(messages, "user.email"),
        accountDomains: this.queryUtil.extractUniqueValues(
          messages,
          "account.domain"
        )
      });
    }

    this.hullClient.logger.debug("outgoing.job.progress", {
      step: "findResults",
      sfLeads: sfLeads.length,
      sfContacts: sfContacts.length,
      sfAccounts: sfAccounts.length,
      userIds: this.queryUtil.extractUniqueValues(messages, "user.id"),
      userEmails: this.queryUtil.extractUniqueValues(messages, "user.email"),
      accountDomains: this.queryUtil.extractUniqueValues(
        messages,
        "account.domain"
      )
    });
  }

  logSkip(skippedMessages: Array<Object>) {
    _.forEach(skippedMessages, skipped => {
      const { envelope, skipReason, log, hullType } = skipped;
      if (log === false) {
        return;
      }
      const { user, account } = envelope.message;
      if (hullType === "user") {
        this.hullClient
          .asUser(user)
          .logger.info("outgoing.user.skip", { reason: skipReason });
      } else {
        this.hullClient
          .asAccount(account)
          .logger.info("outgoing.account.skip", { reason: skipReason });
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
      error: "Unknown API error",
      name: errorName,
      details: errorMessage
    });
    throw error;
  }
}

module.exports = SyncAgent;
