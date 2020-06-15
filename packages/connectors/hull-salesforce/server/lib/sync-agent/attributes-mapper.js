/* @flow */

import type { THullUser } from "hull";
import type { TResourceType } from "../types";

const {
  removeTraitsPrefix
} = require("hull-connector-framework/src/purplefusion/utils");

const _ = require("lodash");
const { SUPPORTED_RESOURCE_TYPES } = require("../types");

const TOPLEVEL_ATTRIBUTES = {
  Lead: [
    { service: "FirstName", hull: "first_name" },
    { service: "LastName", hull: "last_name" },
  ],
  Contact: [
    { service: "FirstName", hull: "first_name" },
    { service: "LastName", hull: "last_name" },
  ],
  Account: [
    { service: "Name", hull: "name" },
    { service: "Website", hull: "domain" }
  ],
  Task: []
};

/**
 * Creates the Hull attribute name from a given salesforce field name.
 *
 * @export
 * @param {string} attributeGroup The name of the attribute group.
 * @param {string} salesforceField The name of the field in Salesforce.
 * @returns {string} The hull attribute name.
 */
function createAttributeName(attributeGroup: string, salesforceField: string): string {
  // salesforceField = _.snakeCase(salesforceField.replace(/__c$/, ""))
  //  .replace(/_created$/, "_created_at");
  return `${salesforceField
    .replace("traits_", "")
    .replace(/_created$/, "_created_at")}`;
}

/**
 * Utility that maps Hull objects to Salesforce objects and vice versa.
 *
 * @export
 * @class AttributesMapper
 */
class AttributesMapper {
  /**
   * Gets or sets the outbound attribute mappings.
   *
   * @memberof AttributesMapper
   */
  mappingsOutbound: Object;

  /**
   * Gets or sets the inbound attribute mappings.
   *
   * @memberof AttributesMapper
   */
  mappingsInbound: Object;

  // Gets or sets the account identifier in Hull.
  accountClaims: Array<Object>;

  /**
   * Creates an instance of AttributesMapper.
   * @param {*} connectorSettings The settings of the connector, passed as object.
   * @memberof AttributesMapper
   */
  constructor(connectorSettings: any) {
    this.mappingsOutbound = {};
    this.mappingsInbound = {};
    this.accountClaims = _.get(connectorSettings, "account_claims", []);

    this.addAccountClaimsToOutgoingAttributes(connectorSettings);

    _.forEach(SUPPORTED_RESOURCE_TYPES, (r) => {
      _.set(this.mappingsOutbound, r, _.cloneDeep(_.get(connectorSettings, `${r.toLowerCase()}_attributes_outbound`)));
      _.set(this.mappingsInbound, r, _.cloneDeep(_.get(connectorSettings, `${r.toLowerCase()}_attributes_inbound`)));
    });

    _.forEach(SUPPORTED_RESOURCE_TYPES, (r) => {
      const userSegmentsAttribute = _.get(connectorSettings, `${r.toLowerCase()}_outgoing_user_segments`);

      if (userSegmentsAttribute) {
        this.mappingsOutbound[r].push({
          hull: "materialized_hull_user_segments",
          service: userSegmentsAttribute,
          overwrite: true
        });
      }
      const accountSegmentsAttribute = _.get(connectorSettings, `${r.toLowerCase()}_outgoing_account_segments`);
      if (accountSegmentsAttribute) {
        this.mappingsOutbound[r].push({ hull: "materialized_hull_account_segments", service: accountSegmentsAttribute, overwrite: true });
      }
    });
  }

  getSfdcValue(sObject: Object, resourceSchema: Object, resource: TResourceType, sfdcField: string) {
    let sfdcValue = _.get(sObject, sfdcField);

    if (!_.isNil(resourceSchema) && !_.isNil(sfdcValue)) {
      const fieldType = _.get(resourceSchema, sfdcField, "");
      if (fieldType === "multipicklist") {
        sfdcValue = _.split(sfdcValue, ";").sort((a, b) => {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        });
      }
    }
    return sfdcValue;
  }

  addAccountClaimsToOutgoingAttributes(connectorSettings: any) {
    const accountClaimHullFields = _.get(connectorSettings, "account_claims", []);
    const account_attributes_outbound = _.get(connectorSettings, "account_attributes_outbound", []);
    const accountOutgoingHullFields = _.map(account_attributes_outbound, "hull");

    const missingOutgoingAccountClaims = _.filter(accountClaimHullFields, (accountClaim) => {
      const hullField = accountClaim.hull;
      return !_.includes(accountOutgoingHullFields, hullField);
    });

    _.forEach(missingOutgoingAccountClaims, (accountClaim) => {
      const account_attribute_outbound = {
        hull: accountClaim.hull,
        service: accountClaim.service,
        overwrite: false
      };
      account_attributes_outbound.push(account_attribute_outbound);
    });
  }

  /**
   * Maps a Hull object to a Salesforce object that can be sent to
   * the Salesforce API.
   *
   * @param {TResourceType} resource The name of the Salesforce resource.
   * @param {*} hullObject The user or account object from Hull.
   * @param {Array} userSegments
   * @param {Array} accountSegments
   * @returns {*} The mapped Salesforce Object.
   * @memberof AttributesMapper
   */
  mapToServiceObject(resource: TResourceType, hullObject: THullUser | Object, userSegments: Array<Object> = [], accountSegments: Array<Object> = []): Object {
    const mappings = _.cloneDeep(_.get(this.mappingsOutbound, resource));

    if (!_.isArray(mappings) || _.size(mappings) === 0) {
      return {};
    }

    // Always add the salesforce identifier and make sure that user doesn't override it
    _.remove(mappings, (m) => {
      return _.toLower(m.service) === "id";
    });
    const attribSfIdent = resource === "Account" ? "salesforce/id" : `salesforce_${resource.toLowerCase()}/id`;
    mappings.push({ hull: attribSfIdent, service: "Id" });

    if (resource === "Contact") {
      const accountIdMapping = _.filter(mappings, { service: "AccountId" });

      if (accountIdMapping.length === 0) {
        mappings.push({ hull: "salesforce_contact/account_id", service: "AccountId" });
      }
    }

    const sObject = {};
    _.forEach(mappings, (m) => {
      const { service, hull: hullRaw } = m;
      const hull = removeTraitsPrefix(hullRaw);
      if (!_.isEmpty(service) && !_.isEmpty(hull)) {
        let hullAttribValue = _.get(hullObject, hull, null);

        if (_.isNil(hullAttribValue)) {
          if (hull && hull.startsWith("user.")) {
            const userValue = _.get(hullObject, hull.replace("user.", ""), null);
            if (service && !_.isNil(userValue)) {
              hullAttribValue = userValue;
            }
          } else if (hull && hull.startsWith("account.")) {
            const accountValue = _.get(hullObject, hull.replace("account.", ""), null);
            if (service && !_.isNil(accountValue)) {
              hullAttribValue = accountValue;
            }
          }
        }

        if (hull === "materialized_hull_user_segments") {
          hullAttribValue = _.map(userSegments, "name");
        } else if (hull === "materialized_hull_account_segments") {
          hullAttribValue = _.map(accountSegments, "name");
        }

        if (!_.isNil(hullAttribValue)) {
          if (_.isArray(hullAttribValue)) {
            hullAttribValue = hullAttribValue.sort((a, b) => {
              return a.toLowerCase()
                .localeCompare(b.toLowerCase());
            });

            _.set(sObject, service, hullAttribValue.join(";"));
          } else if (_.isString(hullAttribValue) && hullAttribValue.length > 0) {
            // eslint-disable-next-line flowtype-errors/show-errors
            _.set(sObject, service, hullAttribValue.replace(/[\u0003]/g, ""));
          } else if (!_.isString(hullAttribValue)) {
            _.set(sObject, service, hullAttribValue);
          }
        }
      }
    });
    return sObject;
  }

  /**
   * Maps a Salesforce object to an object of traits that can be sent to
   * the Hull platform.
   * Note: This is not a Hull user or account object!
   *
   * @param {TResourceType} resource The name of the Salesforce resource.
   * @param {*} sObject The Salesforce object.
   * @param resourceSchema
   * @returns {*} The object containing the information about the traits to set.
   * @memberof AttributesMapper
   */
  mapToHullAttributeObject(resource: TResourceType, sObject: any, resourceSchema: Object): any {
    const mappings = _.get(this.mappingsInbound, resource, []);
    const attribPrefix = resource === "Account" ? "salesforce" : `salesforce_${resource.toLowerCase()}`;

    if (!_.includes(mappings, "Id")) {
      mappings.push({ service: "Id", hull: `${attribPrefix}/id` });
    }

    const topLevelAttributes = TOPLEVEL_ATTRIBUTES[resource];
    const topLevelAttributesSf = _.map(topLevelAttributes, "service");

    const hObject = { };
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < _.size(mappings); i++) {
      const mapping = mappings[i];
      const { service, hull } = mapping;
      if (!_.isEmpty(service) && !_.isEmpty(hull)) {
        // eslint-disable-next-line no-await-in-loop
        const sfdcValue = this.getSfdcValue(sObject, resourceSchema, resource, mapping.service);

        if (_.includes(topLevelAttributesSf, mapping.service)) {
          if (!_.isNil(sfdcValue)) {
            const tlAttribName = _.find(topLevelAttributes, (tla) => {
              return tla.service === mapping.service;
            });
            _.set(hObject, _.get(tlAttribName, "hull"), { value: sfdcValue, operation: "setIfNull" });
            _.set(hObject, createAttributeName(attribPrefix, mapping.hull), { value: sfdcValue, operation: "set" });
          }
        } else if (!_.isUndefined(sfdcValue)) {
          let traitSet = { value: sfdcValue, operation: "set" };
          if (mapping.service === "Id") {
            traitSet = { value: sfdcValue, operation: "setIfNull" };
          }
          // All other attributes need to be lowercase and
          // _created needs to be replaced by _created_at and __c needs to be removed
          _.set(hObject, createAttributeName(attribPrefix, mapping.hull), traitSet);
        }
      }
    }
    return hObject;
  }

  mapToHullEvent(mapping: Object, resource: TResourceType, sObject: any): any {
    const event = _.cloneDeep(sObject);
    _.forEach(mapping.fetchFields, (hull, service) => {
      const value = _.get(sObject, service);
      if (value) {
        _.unset(event, service);
        _.set(event, hull, value);
      }
    });

    return event;
  }

  mapToHullDeletedObject(resource: TResourceType, deletedAt: Date): any {
    const mappings = _.get(this.mappingsInbound, resource, []);
    const attribPrefix = resource === "Account" ? "salesforce" : `salesforce_${resource.toLowerCase()}`;

    if (!_.includes(mappings, "Id")) {
      mappings.push({ service: "Id", hull: `${attribPrefix}/id` });
    }

    const hObject = { };
    _.forEach(mappings, (mapping) => {
      const traitSet = { value: null, operation: "set" };
      _.set(hObject, createAttributeName(attribPrefix, mapping.hull), traitSet);
    });
    _.set(hObject, `${attribPrefix}/deleted_at`, { value: deletedAt, operation: "set" });

    return hObject;
  }

  mapToHullIdentObject(resource: TResourceType, sObject: any): any {
    const ident = {};
    let identSfdc = "Email";
    let identHull = "email";
    switch (resource) {
      case "Account":

        _.set(ident, "anonymous_id", `salesforce:${_.get(sObject, "Id")}`);
        _.forEach(this.accountClaims, (accountClaim) => {
          identSfdc = accountClaim.service;
          identHull = accountClaim.hull;

          _.set(ident, identHull, _.get(sObject, identSfdc));
        });

        break;
      case "Task":
        _.set(ident, "event_id", `salesforce-${_.toLower(resource)}:${_.get(sObject, "Id")}`);
        break;
      default:
        _.set(ident, identHull, _.get(sObject, identSfdc));
        _.set(ident, "anonymous_id", `salesforce-${_.toLower(resource)}:${_.get(sObject, "Id")}`);
        break;
    }
    return ident;
  }
}

module.exports = {
  createAttributeName,
  AttributesMapper
};
