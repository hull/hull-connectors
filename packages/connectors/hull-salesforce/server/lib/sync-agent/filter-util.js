/* @flow */
import type {
  HullAccountUpdateMessage,
  HullEntityName,
  HullUserUpdateMessage
} from "hull";
import type {
  TFilterResults,
  IUserUpdateEnvelope,
  IAccountUpdateEnvelope,
  IFilterUtil,
  TResourceType
} from "../types";

const _ = require("lodash");
const MatchUtil = require("./match-util");

class FilterUtil implements IFilterUtil {
  contactSynchronizedSegments: Array<string>;

  leadSynchronizedSegments: Array<string>;

  accountSynchronizedSegments: Array<string>;

  requireEmail: boolean;

  requireUserChanges: boolean;

  requireAccountChanges: boolean;

  sendDeletedObjects: boolean;

  // Gets or sets the account identifier in Hull.
  accountClaims: Array<Object>;

  leadAttributesOutbound: Array<string>;

  contactAttributesOutbound: Array<string>;

  accountAttributesOutbound: Array<string>;

  allowShortDomains: boolean;

  source: string;

  /**
   * Creates an instance of FilterUtil.
   * @param {Object} privateSettings The private settings from the connector.
   * @memberof FilterUtil
   */
  constructor(privateSettings: Object) {
    this.source = _.get(privateSettings, "source", "salesforce");
    this.contactSynchronizedSegments = _.get(
      privateSettings,
      "contact_synchronized_segments",
      []
    );
    this.leadSynchronizedSegments = _.get(
      privateSettings,
      "lead_synchronized_segments",
      []
    );
    this.accountSynchronizedSegments = _.get(
      privateSettings,
      "account_synchronized_segments",
      []
    );
    this.requireEmail = _.get(
      privateSettings,
      "ignore_users_withoutemail",
      false
    );
    this.requireUserChanges = _.get(
      privateSettings,
      "ignore_users_withoutchanges",
      false
    );
    this.requireAccountChanges = _.get(
      privateSettings,
      "ignore_accounts_withoutchanges",
      false
    );
    this.sendDeletedObjects = !_.get(
      privateSettings,
      "ignore_deleted_objects",
      true
    );
    this.accountClaims = _.get(privateSettings, "account_claims", []);

    // get the hull attributes for leads, contacts and accounts
    this.leadAttributesOutbound = _.map(
      _.get(privateSettings, "lead_attributes_outbound", []),
      m => m.hull
    );
    this.contactAttributesOutbound = _.map(
      _.get(privateSettings, "contact_attributes_outbound", []),
      m => m.hull
    );
    this.accountAttributesOutbound = _.map(
      _.get(privateSettings, "account_attributes_outbound", []),
      m => m.hull
    );
    this.allowShortDomains = _.get(
      privateSettings,
      "allow_short_domains",
      false
    );
  }

  filterAccountEnvelopes(
    envelopes: Array<IUserUpdateEnvelope> | Array<IAccountUpdateEnvelope>,
    isBatch: boolean = false
  ): TFilterResults {
    const results: TFilterResults = {
      toSkip: [],
      toUpdate: [],
      toInsert: []
    };

    envelopes.forEach(envelope => {
      return this.filterAccountEnvelope(results, envelope, isBatch);
    });
    return results;
  }

  filterAccountEnvelope(
    results: TFilterResults,
    envelope: Object,
    isBatch: boolean
  ): TFilterResults {
    const { message } = envelope;
    const { account: sfAccountMatches } = envelope.matches;
    const { account: hullAccount, user } = message;
    const sfAccount = _.size(sfAccountMatches) === 1 ? sfAccountMatches[0] : {};

    if (_.has(user, "id")) {
      if (this.matchesLeadSynchronizedSegments(envelope)) {
        results.toSkip.push({ envelope, hullType: "user" });
        return results;
      }

      if (!this.matchesContactSynchronizedSegments(envelope)) {
        results.toSkip.push({ envelope, hullType: "user" });
        return results;
      }
    } else if (!isBatch && !this.matchesAccountSynchronizedSegments(envelope)) {
      _.set(envelope.skip, "account", "doesn't match filter for accounts");
      results.toSkip.push({ envelope, hullType: "account" });
      return results;
    }

    if (_.size(sfAccountMatches) > 1) {
      _.set(
        envelope.skip,
        "account",
        "Cannot determine which salesforce account to update"
      );
      results.toSkip.push({ envelope, hullType: "account" });
      return results;
    }

    if (_.isNil(hullAccount) || !_.has(hullAccount, "id")) {
      results.toSkip.push({ envelope, hullType: "account" });
      return results;
    }

    if (
      _.get(hullAccount, `${this.source}/deleted_at`, null) !== null &&
      !this.sendDeletedObjects
    ) {
      _.set(
        envelope.skip,
        "account",
        "Account has been manually deleted in Salesforce and won't be re-created."
      );
      results.toSkip.push({ envelope, hullType: "account" });
      return results;
    }

    const hullAccountClaimFields = _.map(this.accountClaims, "hull");
    for (let i = 0; i < this.accountClaims.length; i += 1) {
      const accountClaim = this.accountClaims[i];
      const isRequired = accountClaim.required;
      const hullField = accountClaim.hull;
      if (isRequired && _.isNil(_.get(hullAccount, hullField, null))) {
        _.set(
          envelope.skip,
          "account",
          "Missing required unique identifier in Hull."
        );
        results.toSkip.push({ envelope, hullType: "account" });
        return results;
      }
    }

    if (_.has(hullAccount, "id")) {
      if (_.has(hullAccount, `${this.source}/id`)) {
        if (
          _.get(sfAccount, "Id", null) ===
          _.get(hullAccount, `${this.source}/id`)
        ) {
          if (!this.accountInArray(results.toUpdate, hullAccount)) {
            results.toUpdate.push(envelope);
          }
          return results;
        }
        if (!this.sendDeletedObjects) {
          if (!this.accountInArray(results.toUpdate, hullAccount)) {
            _.set(
              envelope.skip,
              "account",
              "Account has been potentially manually deleted in Salesforce."
            );
            results.toSkip.push({ envelope, hullType: "account" });
          }
          return results;
        }

        if (!this.accountInArray(results.toUpdate, hullAccount)) {
          results.toInsert.push(envelope);
        }
        return results;
      }

      if (
        _.includes(hullAccountClaimFields, "domain") &&
        _.has(hullAccount, "domain") &&
        _.get(hullAccount, "domain").length < 7 &&
        !this.allowShortDomains
      ) {
        if (!this.accountInArray(results.toSkip, hullAccount)) {
          _.set(
            envelope.skip,
            "account",
            "The domain is too short to perform find on SFDC API, we tried exact match but didn't find any record"
          );
          results.toSkip.push({ envelope, hullType: "account" });
        }
        return results;
      }

      if (!this.accountInArray(results.toInsert, hullAccount)) {
        results.toInsert.push(envelope);
      }
    }
    return results;
  }

  filterEnvelopes(
    envelopes: Array<IUserUpdateEnvelope>,
    resourceType: TResourceType,
    isBatch: boolean = false
  ): TFilterResults {
    if (_.toLower(resourceType) === "account") {
      return this.filterAccountEnvelopes(envelopes, isBatch);
    }

    const traitGroup = `${this.source}_${_.toLower(resourceType)}`;
    const results: TFilterResults = {
      toSkip: [],
      toUpdate: [],
      toInsert: []
    };
    envelopes.forEach(envelope => {
      const { user, account } = envelope.message;
      const matches = envelope.matches[_.toLower(resourceType)];

      if (_.size(matches) > 1) {
        _.set(
          envelope.skip,
          _.toLower(resourceType),
          `Cannot determine which ${_.toLower(resourceType)} to update`
        );
        return results.toSkip.push({ envelope, hullType: "user" });
      }
      const sfObject = _.size(matches) === 1 ? matches[0] : {};
      const existingId = _.get(sfObject, "Id");
      const outgoingId = _.get(user, `${_.toLower(traitGroup)}/id`);

      if (resourceType === "Contact") {
        if (
          !this.matchesContactSynchronizedSegments(envelope) ||
          this.matchesLeadSynchronizedSegments(envelope)
        ) {
          return null;
        }
      }

      if (resourceType === "Lead") {
        if (!this.matchesLeadSynchronizedSegments(envelope)) {
          return null;
        }
      }

      if (_.get(user, "email", "n/a") === "n/a" && this.requireEmail) {
        _.set(
          envelope.skip,
          _.toLower(resourceType),
          "User doesn't have an email address."
        );
        return results.toSkip.push({ envelope, hullType: "user" });
      }

      if (
        _.get(user, `${_.toLower(traitGroup)}/deleted_at`, null) !== null &&
        !this.sendDeletedObjects
      ) {
        _.set(
          envelope.skip,
          _.toLower(resourceType),
          `${resourceType} has been manually deleted in Salesforce.`
        );
        return results.toSkip.push({ envelope, hullType: "user" });
      }

      if (!_.isNil(outgoingId)) {
        if (existingId === outgoingId) {
          return results.toUpdate.push(envelope);
        }
        if (!this.sendDeletedObjects) {
          _.set(
            envelope.skip,
            _.toLower(resourceType),
            `${resourceType} has been potentially manually deleted in Salesforce.`
          );
          return results.toSkip.push({ envelope, hullType: "user" });
        }
        return results.toInsert.push(envelope);
      }

      if (!_.isEmpty(sfObject)) {
        return results.toUpdate.push(envelope);
      }

      if (resourceType === "Contact") {
        if (_.has(user, `${traitGroup}/account_id`) || _.has(account, "id")) {
          return results.toInsert.push(envelope);
        }
        // logging this outside 'batch sent' may produce too many logs
        if (this.isBatch) {
          _.set(
            envelope.skip,
            _.toLower(resourceType),
            `${resourceType} does not have an account`
          );
          return results.toSkip.push({ envelope, hullType: "user" });
        }
      }

      if (resourceType === "Lead") {
        if (
          _.has(user, "salesforce_contact/id") ||
          _.has(user, "salesforce_lead/converted_contact_id")
        ) {
          _.set(
            envelope.skip,
            _.toLower(resourceType),
            "User was synced as a contact from SFDC before, cannot be in a lead segment. Please check your configuration"
          );
          return results.toSkip.push({ envelope, hullType: "user" });
        }

        return results.toInsert.push(envelope);
      }

      return null;
    });
    return results;
  }

  filterContactEnvelopes(
    envelopes: Array<IUserUpdateEnvelope>
  ): TFilterResults {
    return this.filterEnvelopes(envelopes, "Contact");
  }

  filterLeadEnvelopes(envelopes: Array<IUserUpdateEnvelope>): TFilterResults {
    return this.filterEnvelopes(envelopes, "Lead");
  }

  accountInArray(
    messages: Array<IUserUpdateEnvelope> | Array<IAccountUpdateEnvelope>,
    account: Object
  ): boolean {
    const matchUtil = new MatchUtil();

    const missingClaims = _.every(this.accountClaims, v =>
      _.isNil(_.get(account, v.hull))
    );

    if (missingClaims) {
      return false;
    }
    return (
      _.find(messages, e => {
        for (let i = 0; i < this.accountClaims.length; i += 1) {
          const accountClaim = this.accountClaims[i];

          const standardAccount = _.get(e, "message.account", null);

          let standardValue = _.get(
            standardAccount,
            `${accountClaim.hull}`,
            ""
          );
          let incomingValue = _.get(account, `${accountClaim.hull}`, "");
          if (accountClaim.hull === "domain") {
            standardValue = matchUtil.extractMatchingDomain(standardValue);
            incomingValue = matchUtil.extractMatchingDomain(incomingValue);
          }
          if (standardValue !== incomingValue) {
            return false;
          }
        }

        return true;
      }) !== undefined
    );
  }

  filterLeads(
    messages: Array<IUserUpdateEnvelope>
  ): Array<IUserUpdateEnvelope> {
    return _.filter(messages, message => {
      return this.matchesLeadSynchronizedSegments({
        message
      });
    });
  }

  filterContacts(
    messages: Array<IUserUpdateEnvelope>
  ): Array<IUserUpdateEnvelope> {
    return _.filter(messages, message => {
      return (
        this.matchesContactSynchronizedSegments({
          message
        }) &&
        !this.matchesLeadSynchronizedSegments({
          message
        })
      );
    });
  }

  matchesContactSynchronizedSegments(envelope: IUserUpdateEnvelope): boolean {
    const messageSegmentIds = _.compact(envelope.message.segments).map(
      s => s.id
    );
    return (
      _.intersection(messageSegmentIds, this.contactSynchronizedSegments)
        .length > 0
    );
  }

  matchesLeadSynchronizedSegments(envelope: IUserUpdateEnvelope): boolean {
    const messageSegmentIds = _.compact(envelope.message.segments).map(
      s => s.id
    );
    return (
      _.intersection(messageSegmentIds, this.leadSynchronizedSegments).length >
      0
    );
  }

  matchesAccountSynchronizedSegments(
    envelope: IAccountUpdateEnvelope
  ): boolean {
    const messageSegmentIds = _.compact(envelope.message.account_segments).map(
      s => s.id
    );
    return (
      _.intersection(messageSegmentIds, this.accountSynchronizedSegments)
        .length > 0
    );
  }

  /**
   * Filters out messages which we should not be processed
   */
  filterMessages(
    sfType: TResourceType,
    messages: Array<HullUserUpdateMessage | HullAccountUpdateMessage>,
    isBatch: boolean = false
  ): Array<Object> {
    const hullType = _.toLower(sfType) === "account" ? "account" : "user";
    return messages.filter(message => {
      if (
        hullType === "user" &&
        this.requireEmail &&
        _.get(message, "user.email", "n/a") === "n/a"
      ) {
        return false;
      }
      if (this[`require${_.upperFirst(hullType)}Changes`] && !isBatch) {
        return this.hasChangedWhitelistedAttributes(
          hullType,
          message,
          this[`${_.toLower(sfType)}AttributesOutbound`]
        );
      }
      return true;
    });
  }

  hasChangedWhitelistedAttributes(
    hullType: HullEntityName,
    message: Object,
    outgoingHullAttributes: Array<string>
  ): boolean {
    const entityAttributeChanges = _.get(message.changes, hullType, {});
    if (hullType === "user") {
      const accountChanges = _.get(message, "changes.account", {});
      _.forEach(accountChanges, (value, key) => {
        entityAttributeChanges[`account.${key}`] = value;
      });
    }

    if (!_.isEmpty(entityAttributeChanges)) {
      const changedAttributes = _.reduce(
        entityAttributeChanges,
        (changeList, value, key) => {
          changeList.push(this.standardizeAttributeName(key));
          return changeList;
        },
        []
      );

      return !_.isEmpty(
        _.intersection(outgoingHullAttributes, changedAttributes)
      );
    }
    return false;
  }

  standardizeAttributeName(attributeName: string): string {
    if (/\[\d+\]$/.test(attributeName)) {
      return attributeName.substr(0, attributeName.lastIndexOf("["));
    }

    return attributeName;
  }
}

module.exports = FilterUtil;
