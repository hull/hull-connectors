/* @flow */
import type { TResourceType, IUserUpdateEnvelope, IAccountUpdateEnvelope, IApiResultObject } from "../types";

const _ = require("lodash");
const UriJs = require("urijs");

const regex = new RegExp("^((https?|ftp)://|(www|ftp)\.)[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$"); // eslint-disable-line no-useless-escape

class MatchUtil {
  /**
   * Extracts the matching domain from the provided website address.
   *
   * @export
   * @param {string} website The url of the website.
   * @returns {string} The hostname or an empty string if no valid url.
   */
  extractMatchingDomain(website: string): string {
    let domainMatch = "";
    if (_.isNil(website)) {
      return domainMatch;
    }
    const matchingWebsite = _.first(website.match(/^((https?|ftps?):\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/g));
    if (_.isNil(matchingWebsite)) {
      return domainMatch;
    }
    website = matchingWebsite.replace(/\\/, "");
    if (website.match(/^((https?|ftps?):\/\/)/) === null) {
      website = `https://${website}`;
    }
    let uri = new UriJs(website);
    if (uri.path() === website && regex.test(website)) {
      uri = new UriJs("");
      uri.hostname(website);
      domainMatch = uri.domain();
    } else if (uri.path() === website) {
      // Attempt to parse it, but if it is not a valid hostname at all
      // don't blow up the entire processing
      try {
        let websiteWithoutPath = website;
        if (website.indexOf("/") !== -1) {
          websiteWithoutPath = website.split("/")[0];
        }
        uri = new UriJs("");
        uri.hostname(websiteWithoutPath);
        domainMatch = uri.domain();
      } catch (error) {
        domainMatch = "";
      }
    } else {
      domainMatch = uri.domain();
    }

    if (uri.tld() === uri.domain()) {
      domainMatch = "";
    }

    if (uri && domainMatch.length > 2) {
      if (uri.subdomain() !== "www" && uri.subdomain() !== "") {
        domainMatch = `${uri.subdomain()}.${domainMatch}`;
      }
    }

    return domainMatch;
  }

  matchAccounts(envelope: IUserUpdateEnvelope | IAccountUpdateEnvelope, sfAccounts: Array<Object>, accountClaims: Array<Object>, entity: string): Array<Object> {
    let foundSFAccounts: Array<Object> = [];

    const message = _.get(envelope, "message", null);
    const account = message.account;

    if (!_.isNil(account) && _.has(account, "id")) {
      const findBy = {};
      let sfAccount;

      // First attempt to match by Id if present
      if (_.get(account, "salesforce/id", "n/a") !== "n/a") {
        _.set(findBy, "Id", _.get(account, "salesforce/id"));
        sfAccount = _.find(sfAccounts, findBy);
      }

      // TODO: confirm
      if (_.isNil(sfAccount)) {
        if (_.get(envelope, "message.user.salesforce_contact/account_id", "n/a") !== "n/a") {
          _.set(findBy, "Id", _.get(envelope, "message.user.salesforce_contact/account_id"));
          sfAccount = _.find(sfAccounts, findBy);
        }
      }

      if (!_.isNil(sfAccount)) {
        const sfAccountId = _.get(sfAccount, "Id", "");
        if (entity === "user" && _.get(envelope, "message.user.salesforce_contact/account_id", "n/a") === "n/a") {
          _.set(envelope, "message.user.salesforce_contact/account_id", sfAccountId);
        }

        _.set(account, "salesforce/id", sfAccountId);
        _.set(envelope, "currentSfAccount", sfAccount);

        // eslint-disable-next-line flowtype-errors/show-errors
        foundSFAccounts.push(sfAccount);
        _.set(envelope, "allSfAccountMatches", foundSFAccounts);
        return foundSFAccounts;
      }

      // Try to find a match by the configured identifier
      const identityClaims = this.getMatchingAccountIdentityClaims(sfAccounts, accountClaims, account);
      foundSFAccounts = this.resolveSalesForceAccountIdentityClaims(accountClaims, identityClaims);
      _.set(envelope, "allSfAccountMatches", foundSFAccounts);

      if (foundSFAccounts.length === 1) {
        sfAccount = foundSFAccounts[0];
        if (entity === "user" && _.get(envelope, "message.user.salesforce_contact/account_id", "n/a") === "n/a") {
          _.set(envelope, "message.user.salesforce_contact/account_id", sfAccount.Id);
        }
        _.set(account, "salesforce/id", sfAccount.Id);
        _.set(envelope, "currentSfAccount", sfAccount);
      } else if (foundSFAccounts.length === 0) {
        _.unset(account, "salesforce/id");
        _.unset(envelope.message.user, "salesforce_contact/account_id");
      } else if (foundSFAccounts.length > 1) {
        _.unset(account, "salesforce/id");
        _.unset(envelope.message.user, "salesforce_contact/account_id");
      }
    }

    return foundSFAccounts;
  }

  resolveSalesForceAccountIdentityClaims(accountClaims: Array<Object>, identityClaims: Object): Array<Object> {
    let filteredAccounts = [];
    for (let i = 0; i < accountClaims.length; i += 1) {
      const accountClaim = accountClaims[i];

      const sfAccounts = _.get(identityClaims, accountClaim.hull);

      // no account claims found
      if (sfAccounts.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // Trying to filter down by multiple criteria here
      // if filteredAccounts is 0, means we've never had any matches yet
      // if filtered accounts is not 0, we need to take the intersection of previous match and this match
      // if nothing matches on the intersection, leave the matches as is
      // this way we match highest priority identifiers first
      // and ensure we return something if any individual field matches (because we don't want to return empty array)
      if (filteredAccounts.length === 0) {
        filteredAccounts = _.cloneDeep(sfAccounts);
      } else {
        const intersection = _.intersectionBy(filteredAccounts, sfAccounts, accountClaim.service);

        if (intersection.length > 0) {
          filteredAccounts = _.cloneDeep(intersection);
        }
      }
    }

    return filteredAccounts;
  }

  // given hull account, find a matching salesforce account
  getMatchingAccountIdentityClaims(sfAccounts: Array<Object>, accountClaims: Array<Object>, account: Object): Object {
    // map of { hullField -> list of matching sfAccount }
    const identityClaims = {};
    _.forEach(accountClaims, (accountClaim) => {
      _.set(identityClaims, accountClaim.hull, []);

      let hullField = _.get(account, `${accountClaim.hull}`, null);

      const sfAccountMatches = _.filter(sfAccounts, (sfAccount) => {
        let serviceField = _.get(sfAccount, `${accountClaim.service}`, "n/a");

        if (!_.isNil(hullField) && accountClaim.hull === "domain") {
          hullField = this.extractMatchingDomain(hullField);
          serviceField = this.extractMatchingDomain(serviceField);
        }

        return !_.isNil(hullField) && hullField === serviceField;
      });

      _.set(identityClaims, accountClaim.hull, _.concat(_.get(identityClaims, accountClaim.hull), sfAccountMatches));
    });

    return identityClaims;
  }

  getMatchingEnvelopes(envelopes: Array<IAccountUpdateEnvelope>, entityClaims: Array<Object>, sfRecord: IApiResultObject, hullEntityType: string) {
    const resourceType = sfRecord.resource;
    const sfObject = sfRecord.record;
    const identityClaims = {};
    _.forEach(entityClaims, (claim) => {
      _.set(identityClaims, claim.hull, []);

      const matchingEnvelopes = _.filter(envelopes, (envelope) => {
        const message = _.get(envelope, "message", null);

        let hullEntity = {};
        if (resourceType === "Account") {
          hullEntity = message.account;
        }

        if (resourceType === "Contact" || resourceType === "Lead") {
          hullEntity = _.get(message, hullEntityType);
        }

        let hullField = _.get(hullEntity, `${claim.hull}`, null);
        let serviceField = _.get(sfObject, `${claim.service}`, "n/a");

        if (!_.isNil(hullField) && claim.hull === "domain") {
          hullField = this.extractMatchingDomain(hullField);
          serviceField = this.extractMatchingDomain(serviceField);
        }

        return !_.isNil(hullField) && hullField === serviceField;
      });

      _.set(identityClaims, claim.hull, _.concat(_.get(identityClaims, claim.hull), matchingEnvelopes));
    });

    return identityClaims;
  }

  resolveSalesForceEnvelopeIdentityClaims(entityClaims: Array<Object>, identityClaims: Object): Array<Object> {
    let filteredEnvelopes = [];
    for (let i = 0; i < entityClaims.length; i += 1) {
      const accountClaim = entityClaims[i];

      const sfEnvelopes = _.get(identityClaims, accountClaim.hull);

      // no envelopes found
      if (sfEnvelopes.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (filteredEnvelopes.length === 0) {
        filteredEnvelopes = sfEnvelopes;
      } else {
        const intersection = _.intersectionBy(filteredEnvelopes, sfEnvelopes, "message.message_id");
        if (intersection.length > 0) {
          filteredEnvelopes = intersection;
        }
      }
    }

    return filteredEnvelopes;
  }

  matchUsers(resource: TResourceType, envelope: IUserUpdateEnvelope, sfObjects: Array<Object>): void {
    if (resource !== "Contact" && resource !== "Lead") {
      throw new Error("Unsupported resource type. Only Contact and Lead can be matched to an user.");
    }
    let sfObject;
    // First attempt to match by Id
    if (_.get(envelope, `message.user.salesforce_${_.toLower(resource)}/id`, "n/a") !== "n/a") {
      sfObject = _.find(sfObjects, { Id: _.get(envelope, `message.user.salesforce_${_.toLower(resource)}/id`) });
    }
    // Try to find a match by email
    if (!sfObject) {
      sfObject = _.find(sfObjects, { Email: _.get(envelope, "message.user.email", "n/a") });
    }
    // Handle result
    if (sfObject) {
      _.set(envelope, `message.user.salesforce_${_.toLower(resource)}/id`, sfObject.Id);
      _.set(envelope, `currentSf${resource}`, sfObject);
    } else {
      _.unset(envelope, `message.user.salesforce_${_.toLower(resource)}/id`);
    }
  }
}


module.exports = MatchUtil;
