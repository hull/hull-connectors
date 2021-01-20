/* @flow */
import type {
  THullAccountUpdateMessage,
  THullUserUpdateMessage,
  THullObject
} from "hull";
import type { IMatchUtil, TResourceType } from "../types";

const _ = require("lodash");
const UriJs = require("urijs");

const regex = new RegExp(
  "^((https?|ftp)://|(www|ftp).)[a-z0-9-]+(.[a-z0-9-]+)+([/?].*)?$"
); // eslint-disable-line no-useless-escape

class MatchUtil implements IMatchUtil {
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
    const matchingWebsite = _.first(
      website.match(
        /^((https?|ftps?):\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/g
      )
    );
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

  getIdentityClaimMatches({
    entities, // messages or sf objects
    identityClaims,
    searchEntity, // message or sf object
    searchType // hull (match hull to sf objects) or salesforce (match sf object to messages)
  }: {
    entities: Array<Object>,
    identityClaims: Array<Object>,
    searchEntity: Object,
    searchType: string
  }): Object {
    const identityClaimMatches = {};
    _.forEach(identityClaims, identityClaim => {
      const { hull, service } = identityClaim;
      identityClaimMatches[hull] = [];

      const { searchByKey, searchForKey, searchFor, searchForType } =
        searchType === "hull"
          ? {
              searchByKey: hull,
              searchForKey: service,
              searchFor: searchEntity,
              searchForType: "hull"
            }
          : {
              searchByKey: service,
              searchForKey: hull,
              searchFor: searchEntity.record,
              searchForType: searchEntity.resource
            };

      let searchField = _.get(searchFor, searchByKey);

      const matches = _.filter(entities, entity => {
        let checkEntity = entity;
        if (searchForType === "Account") {
          checkEntity = entity.account;
        }

        if (searchForType === "Contact" || searchForType === "Lead") {
          checkEntity = entity.user;
        }

        let matchField = _.get(checkEntity, `${searchForKey}`);

        if (!_.isNil(searchField) && searchByKey === "domain") {
          searchField = this.extractMatchingDomain(searchField);
          matchField = this.extractMatchingDomain(matchField);
        }

        return !_.isNil(searchField) && searchField === matchField;
      });
      const existingMatches = _.get(identityClaimMatches, searchByKey, []);
      _.set(identityClaimMatches, hull, [...existingMatches, ...matches]);
    });

    return identityClaimMatches;
  }

  filterIdentityClaimMatches({
    identityClaims,
    identityClaimMatches,
    intersectBy
  }: {
    identityClaims: Array<Object>,
    identityClaimMatches: Object,
    intersectBy: Object
  }): Array<Object> {
    const { path, resolve } = intersectBy;

    let filteredEntities = [];
    for (let i = 0; i < identityClaims.length; i += 1) {
      const { hull } = identityClaims[i];

      // TODO add better support to dynamically resolve key
      const intersectByKey = resolve ? identityClaims[i][path] : path;

      const sfEntities = _.get(identityClaimMatches, hull);

      // no account claims found
      if (sfEntities.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // Trying to filter down by multiple criteria here
      // if filteredAccounts is 0, means we've never had any matches yet
      // if filtered accounts is not 0, we need to take the intersection of previous match and this match
      // if nothing matches on the intersection, leave the matches as is
      // this way we match highest priority identifiers first
      // and ensure we return something if any individual field matches (because we don't want to return empty array)
      if (filteredEntities.length === 0) {
        filteredEntities = sfEntities;
      } else {
        const intersection = _.intersectionBy(
          filteredEntities,
          sfEntities,
          intersectByKey
        );

        if (intersection.length > 0) {
          filteredEntities = intersection;
        }
      }
    }

    return filteredEntities;
  }

  matchHullMessageToSalesforceRecord({
    resource,
    user,
    sfObjects,
    identityClaims = [],
    source
  }: {
    resource: TResourceType,
    user: THullObject,
    sfObjects: Array<Object>,
    identityClaims: Array<Object>,
    source: string
  }): any {
    if (resource !== "Contact" && resource !== "Lead") {
      throw new Error(
        "Unsupported resource type. Only Contact and Lead can be matched to an user."
      );
    }
    let sfObject;
    if (_.get(user, `${source}_${_.toLower(resource)}/id`, "n/a") !== "n/a") {
      sfObject = _.find(sfObjects, {
        Id: _.get(user, `${source}_${_.toLower(resource)}/id`)
      });
    }
    if (!sfObject) {
      const identityClaimMatches = this.getIdentityClaimMatches({
        entities: sfObjects,
        identityClaims,
        searchEntity: user,
        searchType: "hull"
      });
      const filteredMatches = this.filterIdentityClaimMatches({
        identityClaims,
        identityClaimMatches,
        intersectBy: { path: "service", resolve: true }
      });
      if (!_.isEmpty(filteredMatches)) {
        sfObject = filteredMatches[0];
      }
    }

    return sfObject ? [sfObject] : [];
  }

  matchHullMessageToSalesforceAccount({
    message,
    sfAccounts,
    accountClaims,
    source
  }: {
    message: THullUserUpdateMessage | THullAccountUpdateMessage,
    sfAccounts: Array<Object>,
    accountClaims: Array<Object>,
    source: string
  }): Object {
    const foundSFAccounts = {
      primary: [],
      secondary: []
    };

    const { user, account } = message;

    if (!_.isNil(account) && _.has(account, "id")) {
      const findBy = {};
      let sfAccount;

      if (_.get(account, `${source}/id`, null)) {
        _.set(findBy, "Id", _.get(account, `${source}/id`));
        sfAccount = _.find(sfAccounts, findBy);
      }
      if (_.isNil(sfAccount)) {
        if (_.get(user, `${source}_contact/account_id`, null)) {
          _.set(findBy, "Id", _.get(user, `${source}_contact/account_id`));
          sfAccount = _.find(sfAccounts, findBy);
        }
      }

      if (!_.isNil(sfAccount)) {
        foundSFAccounts.primary = [sfAccount];
        return foundSFAccounts;
      }

      const identityClaimMatches = this.getIdentityClaimMatches({
        entities: sfAccounts,
        identityClaims: accountClaims,
        searchEntity: account,
        searchType: "hull"
      });
      foundSFAccounts.secondary = this.filterIdentityClaimMatches({
        identityClaims: accountClaims,
        identityClaimMatches,
        intersectBy: { path: "service", resolve: true }
      });
    }

    return foundSFAccounts;
  }
}

module.exports = MatchUtil;
