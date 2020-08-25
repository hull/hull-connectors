/* @flow */
import type {
  TFilterResults,
  IUserUpdateEnvelope,
  IAccountUpdateEnvelope,
  IFilterUtil
} from "../types";

const _ = require("lodash");
const MatchUtil = require("./match-util");
const { TResourceType } = require("../types");

class FilterUtil implements IFilterUtil {
  contactSynchronizedSegments: Array<string>;

  leadSynchronizedSegments: Array<string>;

  accountSynchronizedSegments: Array<string>;

  requireEmail: boolean;

  requireEntityChanges: boolean;

  sendDeletedObjects: boolean;

  // Gets or sets the account identifier in Hull.
  accountClaims: Array<Object>;

  leadAttributesOutbound: Array<string>;

  contactAttributesOutbound: Array<string>;

  accountAttributesOutbound: Array<string>;

  allowShortDomains: boolean;

  /**
   * Creates an instance of FilterUtil.
   * @param {Object} privateSettings The private settings from the connector.
   * @memberof FilterUtil
   */
  constructor(privateSettings: Object) {
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
    this.requireEntityChanges = _.get(
      privateSettings,
      "ignore_users_withoutchanges",
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
        results.toSkip.push({
          envelope,
          hullType: "user",
          skipReason: "user treated as lead",
          log: false
        });
        return results;
      }

      if (!this.matchesContactSynchronizedSegments(envelope)) {
        results.toSkip.push({
          envelope,
          hullType: "user",
          skipReason: "doesn't match filter for accounts and contacts",
          log: false
        });
        return results;
      }
    } else if (!isBatch && !this.matchesAccountSynchronizedSegments(envelope)) {
      results.toSkip.push({
        envelope,
        hullType: "account",
        skipReason: "doesn't match filter for accounts"
      });
      return results;
    }

    if (_.size(sfAccountMatches) > 1) {
      results.toSkip.push({
        envelope,
        hullType: "account",
        skipReason: "Cannot determine which salesforce account to update"
      });
      return results;
    }

    if (_.isNil(hullAccount) || !_.has(hullAccount, "id")) {
      results.toSkip.push({
        envelope,
        hullType: "account",
        skipReason: "user doesn't have an account"
      });
      return results;
    }

    if (
      _.get(hullAccount, "salesforce/deleted_at", null) !== null &&
      !this.sendDeletedObjects
    ) {
      results.toSkip.push({
        envelope,
        hullType: "account",
        skipReason:
          "Account has been manually deleted in Salesforce and won't be re-created."
      });
      return results;
    }

    const hullAccountClaimFields = _.map(this.accountClaims, "hull");
    for (let i = 0; i < this.accountClaims.length; i += 1) {
      const accountClaim = this.accountClaims[i];
      const isRequired = accountClaim.required;
      const hullField = accountClaim.hull;
      if (isRequired && _.isNil(_.get(hullAccount, hullField, null))) {
        results.toSkip.push({
          envelope,
          hullType: "account",
          skipReason: "Missing required unique identifier in Hull."
        });
        return results;
      }
    }

    if (_.has(hullAccount, "id")) {
      if (_.has(hullAccount, "salesforce/id")) {
        if (
          _.get(sfAccount, "Id", null) === _.get(hullAccount, "salesforce/id")
        ) {
          if (!this.accountInArray(results.toUpdate, hullAccount)) {
            results.toUpdate.push(envelope);
          }
          return results;
        }
        if (!this.sendDeletedObjects) {
          if (!this.accountInArray(results.toUpdate, hullAccount)) {
            results.toSkip.push({
              envelope,
              hullType: "account",
              skipReason:
                "Account has been potentially manually deleted in Salesforce, skipping processing."
            });
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
          results.toSkip.push({
            envelope,
            hullType: "account",
            skipReason:
              "The domain is too short to perform find on SFDC API, we tried exact match but didn't find any record",
            log: !_.has(user, "id")
          });
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
    resourceType: TResourceType
  ): TFilterResults {
    const traitGroup = `salesforce_${_.toLower(resourceType)}`;
    const results: TFilterResults = {
      toSkip: [],
      toUpdate: [],
      toInsert: []
    };
    envelopes.forEach(envelope => {
      const { user, account } = envelope.message;
      const matches = envelope.matches[_.toLower(resourceType)];

      if (_.size(matches) > 1) {
        return results.toSkip.push({
          envelope,
          hullType: "user",
          skipReason: `Cannot determine which ${_.toLower(
            resourceType
          )} to update`
        });
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
        _.set(envelope, "skipReason", "User doesn't have an email address.");
        return results.toSkip.push({
          envelope,
          hullType: "user",
          skipReason: "User doesn't have an email address"
        });
      }

      if (
        _.get(user, `${_.toLower(traitGroup)}/deleted_at`, null) !== null &&
        !this.sendDeletedObjects
      ) {
        return results.toSkip.push({
          envelope,
          hullType: "user",
          skipReason: `${resourceType} has been manually deleted in Salesforce and won't be re-created.`
        });
      }

      if (!_.isNil(outgoingId)) {
        if (existingId === outgoingId) {
          return results.toUpdate.push(envelope);
        }
        if (!this.sendDeletedObjects) {
          return results.toSkip.push({
            envelope,
            hullType: "user",
            skipReason: `${resourceType} has been potentially manually deleted in Salesforce and will not be sent out.`
          });
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
          return results.toSkip.push({
            envelope,
            hullType: "user",
            skipReason: `${resourceType} does not have an account`
          });
        }
      }

      if (resourceType === "Lead") {
        if (
          _.has(user, "salesforce_contact/id") ||
          _.has(user, "salesforce_lead/converted_contact_id")
        ) {
          return results.toSkip.push({
            envelope,
            hullType: "user",
            skipReason:
              "User was synced as a contact from SFDC before, cannot be in a lead segment. Please check your configuration"
          });
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
    array: Array<IUserUpdateEnvelope> | Array<IAccountUpdateEnvelope>,
    account: Object
  ): boolean {
    const matchUtil = new MatchUtil();

    // TODO find should be every?
    return (
      _.find(array, e => {
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
   * Filters out messages which we don't want to process
   */
  filterFindableMessages(
    hullEntityType: string,
    messages: Array<Object>,
    isBatch: boolean = false
  ): Array<Object> {
    if (hullEntityType === "user") {
      return messages.filter(message => {
        const envelope = { message };
        if (
          this.requireEmail &&
          _.get(message, "user.email", "n/a") === "n/a"
        ) {
          return false;
        }

        if (
          !this.matchesContactSynchronizedSegments(envelope) &&
          !this.matchesLeadSynchronizedSegments(envelope)
        ) {
          return false;
        }

        if (this.requireEntityChanges && !isBatch) {
          return this.hasSyncedHullAttributesWithChanges(message);
        }
        return true;
      });
    }
    if (hullEntityType === "account") {
      return this.filterFindableAccountMessages(messages, isBatch);
    }
    return [];
  }

  filterFindableAccountMessages(
    messages: Array<Object>,
    isBatch: boolean = false
  ): Array<Object> {
    return messages.filter(message => {
      const envelope = { message };
      const matchFilter = this.matchesAccountSynchronizedSegments(envelope);

      if (isBatch) {
        return true;
      }

      if (this.requireEntityChanges) {
        return matchFilter && this.hasSyncedHullAttributesWithChanges(message);
      }

      return matchFilter;
    });
  }

  filterDuplicateMessages(
    messages: Array<Object>,
    entity: string
  ): Array<Object> {
    if (!messages || !_.isArray(messages) || messages.length === 0) {
      return [];
    }

    return _.chain(messages)
      .groupBy(`${entity}.id`)
      .map(val => {
        return _.last(_.sortBy(val, [`${entity}.indexed_at`]));
      })
      .value();
  }

  hasSyncedHullAttributesWithChanges(message: Object): boolean {
    const changedUserAttributes = _.keys(_.get(message, "changes.user", {}));
    const standardizedUserAttributes = this.standardizeAttributeNames(
      changedUserAttributes
    );

    const changedAccountAttributes = _.keys(
      _.get(message, "changes.account", {})
    );
    const standardizedAccountAttributes = this.standardizeAttributeNames(
      changedAccountAttributes
    );

    const contactAccountAttributesOutbound = _.map(
      _.filter(this.contactAttributesOutbound, v => {
        return _.startsWith(v, "account.");
      }),
      v => {
        return v.replace("account.", "");
      }
    );
    const leadAccountAttributesOutbound = _.map(
      _.filter(this.leadAttributesOutbound, v => {
        return _.startsWith(v, "account.");
      }),
      v => {
        return v.replace("account.", "");
      }
    );

    return (
      _.intersection(
        leadAccountAttributesOutbound,
        standardizedAccountAttributes
      ).length > 0 ||
      _.intersection(
        contactAccountAttributesOutbound,
        standardizedAccountAttributes
      ).length > 0 ||
      _.intersection(this.leadAttributesOutbound, standardizedUserAttributes)
        .length > 0 ||
      _.intersection(this.contactAttributesOutbound, standardizedUserAttributes)
        .length > 0 ||
      _.intersection(
        this.accountAttributesOutbound,
        standardizedAccountAttributes
      ).length > 0
    );
  }

  standardizeAttributeNames(attributeNames: Array<string>): Array<string> {
    const standardizedNames = [];

    _.forEach(attributeNames, attributeName => {
      if (/\[\d+\]$/.test(attributeName)) {
        const trimmedArrayName = attributeName.substr(
          0,
          attributeName.lastIndexOf("[")
        );
        if (standardizedNames.indexOf(trimmedArrayName) < 0) {
          standardizedNames.push(trimmedArrayName);
        }
      } else {
        standardizedNames.push(attributeName);
      }
    });

    return standardizedNames;
  }
}

module.exports = FilterUtil;
