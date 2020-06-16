/* @flow */
import type { IUserUpdateEnvelope, IAccountUpdateEnvelope } from "../types";

const _ = require("lodash");
const MatchUtil = require("./match-util");

type TFilterResults = {
  toInsert: Array<IUserUpdateEnvelope>,
  toUpdate: Array<IUserUpdateEnvelope>,
  toSkip: Array<IUserUpdateEnvelope>
};

type TAccountFilterResults = {
  toInsert: Array<IAccountUpdateEnvelope>,
  toUpdate: Array<IAccountUpdateEnvelope>,
  toSkip: Array<IAccountUpdateEnvelope>
};

class FilterUtil {
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

  accountInArray(
    array: Array<IUserUpdateEnvelope> | Array<IAccountUpdateEnvelope>,
    account: Object
  ): boolean {
    const matchUtil = new MatchUtil();

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

  filterAccount(
    results: TFilterResults | TAccountFilterResults,
    envelope: Object,
    account: Object,
    sfAccountMatches: Array<Object>,
    entity: string,
    isBatch: boolean
  ): void {
    if (_.isNil(account) || !_.has(account, "id")) {
      _.set(envelope, "skipReason", "user doesn't have an account");
      results.toSkip.push(envelope);
      return;
    }

    if (entity === "user") {
      if (this.matchesLeadSynchronizedSegments(envelope)) {
        _.set(envelope, "skipReason", `${entity} treated as a lead`);
        results.toSkip.push(envelope);
        return;
      }

      if (!this.matchesContactSynchronizedSegments(envelope)) {
        _.set(
          envelope,
          "skipReason",
          "doesn't match filter for accounts and contacts"
        );
        results.toSkip.push(envelope);
        return;
      }
    } else if (entity === "account") {
      if (!isBatch && !this.matchesAccountSynchronizedSegments(envelope)) {
        _.set(envelope, "skipReason", "doesn't match filter for accounts");
        results.toSkip.push(envelope);
        return;
      }
    }

    if (
      _.get(account, "salesforce/deleted_at", null) !== null &&
      !this.sendDeletedObjects
    ) {
      _.set(
        envelope,
        "skipReason",
        "Account has been manually deleted in Salesforce and won't be re-created."
      );
      results.toSkip.push(envelope);
      return;
    }

    if (sfAccountMatches.length > 1) {
      _.set(
        envelope,
        "skipReason",
        "Cannot determine which salesforce account to update."
      );
      results.toSkip.push(envelope);
      return;
    }

    const hullAccountClaimFields = _.map(this.accountClaims, "hull");
    for (let i = 0; i < this.accountClaims.length; i += 1) {
      const accountClaim = this.accountClaims[i];
      const isRequired = accountClaim.required;
      const hullField = accountClaim.hull;
      if (isRequired && _.isNil(_.get(account, hullField, null))) {
        _.set(
          envelope,
          "skipReason",
          "Missing required unique identifier in Hull."
        );
        results.toSkip.push(envelope);
        return;
      }
    }

    if (_.has(account, "id")) {
      // Handle accounts to update
      if (_.has(account, "salesforce/id")) {
        // Verify that it is a valid ID, indicated if the currentSfxxx object is present or not
        if (
          _.get(envelope, "currentSfAccount.Id", null) ===
          _.get(account, "salesforce/id")
        ) {
          if (!this.accountInArray(results.toUpdate, account)) {
            results.toUpdate.push(envelope);
          }
          return;
        }
        if (!this.sendDeletedObjects) {
          _.set(
            envelope,
            "skipReason",
            "Account has been potentially manually deleted in Salesforce, skipping processing."
          );
          if (!this.accountInArray(results.toUpdate, account)) {
            results.toSkip.push(envelope);
          }
          return;
        }

        if (!this.accountInArray(results.toUpdate, account)) {
          results.toInsert.push(envelope);
        }
        return;
      }

      // before we decide to insert that account let's see if this is a less than 7 characters
      // domain, in such case we are only relying on exact match and update
      if (
        _.includes(hullAccountClaimFields, "domain") &&
        _.has(account, "domain") &&
        _.get(account, "domain").length < 7 &&
        !this.allowShortDomains
      ) {
        _.set(
          envelope,
          "skipReason",
          "The domain is too short to perform find on SFDC API, we tried exact match but didn't find any record"
        );
        if (!this.accountInArray(results.toSkip, account)) {
          results.toSkip.push(envelope);
        }
        return;
      }

      if (!this.accountInArray(results.toInsert, account)) {
        results.toInsert.push(envelope);
      }
    }
  }

  filterAccounts(
    envelopes: Array<IUserUpdateEnvelope> | Array<IAccountUpdateEnvelope>,
    entity: string,
    isBatch: boolean = false
  ): TFilterResults {
    const results: TFilterResults = {
      toSkip: [],
      toUpdate: [],
      toInsert: []
    };

    envelopes.forEach(envelope => {
      const { message } = envelope;
      const account = message.account;
      const allSfAccountMatches = _.get(envelope, "allSfAccountMatches", []);
      return this.filterAccount(
        results,
        envelope,
        account,
        allSfAccountMatches,
        entity,
        isBatch
      );
    });
    return results;
  }

  filterContacts(envelopes: Array<IUserUpdateEnvelope>): TFilterResults {
    const results: TFilterResults = {
      toSkip: [],
      toUpdate: [],
      toInsert: []
    };
    envelopes.forEach(envelope => {
      const { message } = envelope;

      // Check if it matches a lead segment as that takes priority
      if (
        this.matchesContactSynchronizedSegments(envelope) &&
        !this.matchesLeadSynchronizedSegments(envelope)
      ) {
        if (
          _.get(message, "user.email", "n/a") === "n/a" &&
          this.requireEmail
        ) {
          _.set(envelope, "skipReason", "User doesn't have an email address.");
          return results.toSkip.push(envelope);
        }

        if (
          _.get(message, "user.salesforce_contact/deleted_at", null) !== null &&
          !this.sendDeletedObjects
        ) {
          _.set(
            envelope,
            "skipReason",
            "Contact has been manually deleted in Salesforce and won't be re-created."
          );
          return results.toSkip.push(envelope);
        }

        if (_.has(message, "user.salesforce_contact/id")) {
          // Verify that it is a valid ID, indicated if the currentSfxxx object is present or not
          if (
            _.get(envelope, "currentSfContact.Id", null) ===
            _.get(message, "user.salesforce_contact/id")
          ) {
            return results.toUpdate.push(envelope);
          }
          if (!this.sendDeletedObjects) {
            _.set(
              envelope,
              "skipReason",
              "Contact has been potentially manually deleted in Salesforce, skipping processing."
            );
            return results.toSkip.push(envelope);
          }

          return results.toInsert.push(envelope);
        }

        if (
          _.has(message, "user.salesforce_contact/account_id") ||
          _.has(message, "account.id")
        ) {
          return results.toInsert.push(envelope);
        }
      }
      return null;
    });
    return results;
  }

  filterLeads(envelopes: Array<IUserUpdateEnvelope>): TFilterResults {
    const results: TFilterResults = {
      toSkip: [],
      toUpdate: [],
      toInsert: []
    };
    envelopes.forEach(envelope => {
      const { message } = envelope;

      if (this.matchesLeadSynchronizedSegments(envelope)) {
        if (
          _.get(message, "user.email", "n/a") === "n/a" &&
          this.requireEmail
        ) {
          _.set(envelope, "skipReason", "User doesn't have an email address.");
          return results.toSkip.push(envelope);
        }

        if (
          _.has(message, "user.salesforce_contact/id") ||
          _.has(message, "user.salesforce_lead/converted_contact_id")
        ) {
          _.set(
            envelope,
            "skipReason",
            "user was synced as a contact from SFDC before, cannot be in a lead segment. Please check your configuration"
          );
          return results.toSkip.push(envelope);
        }

        if (
          _.get(message, "user.salesforce_lead/deleted_at", null) !== null &&
          !this.sendDeletedObjects
        ) {
          _.set(
            envelope,
            "skipReason",
            "Lead has been manually deleted in Salesforce and won't be re-created."
          );
          return results.toSkip.push(envelope);
        }

        if (_.has(message, "user.salesforce_lead/id")) {
          if (
            _.get(envelope, "currentSfLead.Id", null) ===
            _.get(message, "user.salesforce_lead/id")
          ) {
            return results.toUpdate.push(envelope);
          }
          if (!this.sendDeletedObjects) {
            _.set(
              envelope,
              "skipReason",
              "Lead has been potentially manually deleted in Salesforce, skipping processing."
            );
            return results.toSkip.push(envelope);
          }

          return results.toInsert.push(envelope);
        }
        return results.toInsert.push(envelope);
      }
      return null;
    });
    return results;
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
