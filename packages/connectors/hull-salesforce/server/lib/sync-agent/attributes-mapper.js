/* @flow */

import type { THullUser } from "hull";
import type { TResourceType } from "../types";

const {
  removeTraitsPrefix
} = require("hull-connector-framework/src/purplefusion/utils");

const _ = require("lodash");

const { SUPPORTED_RESOURCE_TYPES, IAttributesMapper } = require("../types");

/**
 * Creates the Hull attribute name from a given salesforce field name.
 *
 * @export
 * @param {string} attributeGroup The name of the attribute group.
 * @param {string} salesforceField The name of the field in Salesforce.
 * @returns {string} The hull attribute name.
 */
function createAttributeName(
  attributeGroup: string,
  salesforceField: string
): string {
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
class AttributesMapper implements IAttributesMapper {
  mappingsOutbound: Object;

  mappingsInbound: Object;

  source: string;

  /**
   * Creates an instance of AttributesMapper.
   * @param {*} connectorSettings The settings of the connector, passed as object.
   * @memberof AttributesMapper
   */
  constructor(connectorSettings: any) {
    this.source = _.get(connectorSettings, "source", "salesforce");
    this.mappingsOutbound = {};

    _.forEach(SUPPORTED_RESOURCE_TYPES, r => {
      const outgoingAttributes = _.cloneDeep(
        _.get(connectorSettings, `${r.toLowerCase()}_attributes_outbound`, [])
      );
      const claims = _.cloneDeep(
        _.get(connectorSettings, `${_.toLower(r)}_claims`, [])
      );

      _.set(this.mappingsOutbound, r, _.concat(claims, outgoingAttributes));
    });

    _.forEach(SUPPORTED_RESOURCE_TYPES, r => {
      const userSegmentsAttribute = _.get(
        connectorSettings,
        `${r.toLowerCase()}_outgoing_user_segments`
      );

      if (userSegmentsAttribute) {
        this.mappingsOutbound[r].push({
          hull: "materialized_hull_user_segments",
          service: userSegmentsAttribute,
          overwrite: true
        });
      }
      const accountSegmentsAttribute = _.get(
        connectorSettings,
        `${r.toLowerCase()}_outgoing_account_segments`
      );
      if (accountSegmentsAttribute) {
        this.mappingsOutbound[r].push({
          hull: "materialized_hull_account_segments",
          service: accountSegmentsAttribute,
          overwrite: true
        });
      }
    });
  }

  getSfdcValue(
    sObject: Object,
    resourceSchema: Object,
    resource: TResourceType,
    sfdcField: string
  ) {
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
  mapToServiceObject(
    resource: TResourceType,
    hullObject: THullUser | Object,
    userSegments: Array<Object> = [],
    accountSegments: Array<Object> = []
  ): Object {
    const mappings = _.cloneDeep(_.get(this.mappingsOutbound, resource));

    if (!_.isArray(mappings) || _.size(mappings) === 0) {
      return {};
    }
    _.remove(mappings, m => {
      return _.toLower(m.service) === "id";
    });
    const attribSfIdent =
      resource === "Account"
        ? `${this.source}/id`
        : `${this.source}_${resource.toLowerCase()}/id`;
    mappings.push({ hull: attribSfIdent, service: "Id" });

    if (resource === "Contact") {
      const accountIdMapping = _.filter(mappings, { service: "AccountId" });

      if (accountIdMapping.length === 0) {
        mappings.push({
          hull: `${this.source}_contact/account_id`,
          service: "AccountId"
        });
      }
    }

    const sObject = {};
    _.forEach(mappings, m => {
      const { service, hull: hullRaw } = m;

      const hull = removeTraitsPrefix(hullRaw);
      if (!_.isEmpty(service) && !_.isEmpty(hull)) {
        let hullAttribValue = _.get(hullObject, hull, null);

        if (_.isNil(hullAttribValue)) {
          if (hull && hull.startsWith("account.")) {
            const accountValue = _.get(
              hullObject,
              hull.replace("account.", ""),
              null
            );
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
              return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            _.set(sObject, service, hullAttribValue.join(";"));
          } else if (
            _.isString(hullAttribValue) &&
            hullAttribValue.length > 0
          ) {
            // eslint-disable-next-line
            _.set(sObject, service, hullAttribValue.replace(/[\u0003]/g, ""));
          } else if (!_.isString(hullAttribValue)) {
            _.set(sObject, service, hullAttribValue);
          }
        }
      }
    });
    return sObject;
  }

  // incoming is handled in purplefusion
  mapToHullAttributeObject(resource: TResourceType, sObject: any): any {
    const hObject = {};
    const attribPrefix =
      resource === "Account"
        ? this.source
        : `${this.source}_${resource.toLowerCase()}`;
    hObject[`${attribPrefix}/id`] = {
      value: _.get(sObject, "Id"),
      operation: "setIfNull"
    };

    return hObject;
  }

  mapToHullIdentityObject(
    resourceType: TResourceType,
    sfObject: Object,
    identityClaims: Array<Object>
  ): Object {
    const id = _.get(sfObject, "Id") || _.get(sfObject, "id");
    const ident = {};
    switch (resourceType) {
      case "Account":
        _.set(ident, "anonymous_id", `${this.source}:${id}`);
        _.forEach(identityClaims, claim => {
          const identSfdc = claim.service;
          const identHull = claim.hull;

          const identity = _.get(sfObject, identSfdc);

          if (!_.isNil(identity)) {
            _.set(ident, identHull, identity);
          }
        });

        break;
      default:
        _.set(
          ident,
          "anonymous_id",
          `${this.source}-${_.toLower(resourceType)}:${id}`
        );
        _.forEach(identityClaims, claim => {
          const identSfdc = claim.service;
          const identHull = claim.hull;

          const identity = _.get(sfObject, identSfdc);

          if (!_.isNil(identity)) {
            _.set(ident, identHull, identity);
          }
        });
        break;
    }
    return ident;
  }
}

module.exports = {
  createAttributeName,
  AttributesMapper
};
