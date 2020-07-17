/* @flow */
import type { TResourceType } from "../types";

const _ = require("lodash");
const moment = require("moment");
const { SUPPORTED_RESOURCE_TYPES } = require("../types");

export type TPatchResult = {
  hasChanges: boolean,
  patchObject: any
};

class PatchUtil {
  /**
   * Gets or sets the outbound mappings.
   *
   * @memberof PatchUtil
   */
  mappingsOutbound: Object;

  sendNullValues: boolean;

  /**
   * Creates an instance of PatchUtil.
   * @param {*} connectorSettings The settings of the connector, passed as object.
   * @memberof PatchUtil
   */
  constructor(connectorSettings: any) {
    this.mappingsOutbound = {};
    this.sendNullValues = _.get(connectorSettings, "send_null_values", false);

    _.forEach(SUPPORTED_RESOURCE_TYPES, r => {
      _.set(
        this.mappingsOutbound,
        r,
        _.cloneDeep(
          _.get(connectorSettings, `${r.toLowerCase()}_attributes_outbound`, [])
        )
      );
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

  isDate(value: string) {
    return !_.isNil(value.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g));
  }

  attributeChanged(
    hullAttributeValue: any,
    sfAttributeValue: any,
    sfFieldType: string,
    isTimestamp: boolean
  ): boolean {
    if (_.isNil(sfFieldType)) {
      if (!_.isNil(hullAttributeValue) && !_.isNil(sfAttributeValue)) {
        if (isTimestamp) {
          if (
            moment(hullAttributeValue).diff(
              moment(sfAttributeValue),
              "seconds"
            ) === 0
          ) {
            return false;
          }

          if (_.isString(sfAttributeValue) && this.isDate(sfAttributeValue)) {
            return !moment(hullAttributeValue).isSame(sfAttributeValue, "day");
          }
        }
      }
      return sfAttributeValue !== hullAttributeValue;
    }

    let hullAttributeValues = [];
    if (sfFieldType.includes("picklist")) {
      if (_.isString(hullAttributeValue)) {
        hullAttributeValues = hullAttributeValue.split(";");
      }
      if (_.isArray(hullAttributeValue)) {
        hullAttributeValues = _.cloneDeep(hullAttributeValue);
      }
    }

    if (hullAttributeValues.length !== 0) {
      const sfArrayValues = _.split(sfAttributeValue, ";");

      if (sfArrayValues.length !== hullAttributeValues.length) {
        return true;
      }
      const missingArrayValues = _.filter(hullAttributeValues, hullValue => {
        // return !_.includes(sfArrayValues, hullValue);

        return !_.some(sfArrayValues, sfValue => {
          return sfValue.toLowerCase() === hullValue.toLowerCase();
        });
      });

      return missingArrayValues.length > 0;
    }
    return sfAttributeValue !== hullAttributeValue;
  }

  /**
   * Creates a patch object to handle attributes with and without overwrite in
   * the correct way.
   *
   * @param {TResourceType} resource The name of the Salesforce resource.
   * @param {*} hullToSFObject The Salesforce object created from the current Hull object (result of AttributesMapper).
   * @param {*} existingSFObject The current object in Salesforce, pass an empty object if none exists.
   * @param schema
   * @returns {TPatchResult} The patch result indicating whether to process the object or not.
   * @memberof PatchUtil
   *
   * @throws Will throw an error if the `Id` of the targetObject and actualObject are different to
   *         prevent incorrect patches.
   */
  createPatchObject(
    resource: TResourceType,
    hullToSFObject: any,
    existingSFObject: any,
    schema: Object
  ): TPatchResult {
    const mappings = _.get(this.mappingsOutbound, resource);
    const result: TPatchResult = {
      hasChanges: false,
      patchObject: {}
    };

    if (!_.isArray(mappings) || _.size(mappings) === 0) {
      return result;
    }

    // Throw an error if one attempts to patch two different objects.
    if (
      _.has(hullToSFObject, "Id") &&
      _.has(existingSFObject, "Id") &&
      hullToSFObject.Id !== existingSFObject.Id
    ) {
      throw new Error(
        `The identifier for the hull object ${hullToSFObject.Id} and salesforce object ${existingSFObject.Id} do not match.`
      );
    }

    _.forEach(mappings, m => {
      let valueChanged = false;
      const sfFieldName = m.service;
      const sfFieldType = _.get(schema, sfFieldName, null);
      const hullAttributeValue = _.get(hullToSFObject, sfFieldName, null);
      const sfAttributeValue = _.get(existingSFObject, sfFieldName, null);

      const isTimestamp =
        _.endsWith(m.hull, "_at") || _.endsWith(m.hull, "_date");

      if (!_.isNil(hullAttributeValue) && _.isNil(sfAttributeValue)) {
        // Add new attribute to SF
        if (_.isArray(hullAttributeValue)) {
          _.set(result.patchObject, sfFieldName, hullAttributeValue.join(";"));
        } else {
          _.set(result.patchObject, sfFieldName, hullAttributeValue);
        }

        valueChanged = true;
      } else if (
        m.overwrite === true &&
        this.attributeChanged(
          hullAttributeValue,
          sfAttributeValue,
          sfFieldType,
          isTimestamp
        )
      ) {
        // Changing attribute
        valueChanged = !_.isNil(hullAttributeValue) || this.sendNullValues;
        if (_.isArray(hullAttributeValue)) {
          _.set(result.patchObject, sfFieldName, hullAttributeValue.join(";"));
        } else if (_.isNil(hullAttributeValue)) {
          if (this.sendNullValues) {
            let fieldsToNull = _.get(result.patchObject, "fieldsToNull", null);

            if (_.isNil(fieldsToNull)) {
              fieldsToNull = [];
              _.set(result.patchObject, "fieldsToNull", fieldsToNull);
            }

            fieldsToNull.push(sfFieldName);
          }
        } else {
          _.set(result.patchObject, sfFieldName, hullAttributeValue);
        }
      }

      if (valueChanged) {
        result.hasChanges = valueChanged;
      }
    });

    if (
      resource === "Contact" &&
      existingSFObject &&
      _.get(existingSFObject, "AccountId", null) === null &&
      _.get(hullToSFObject, "AccountId", null) !== null
    ) {
      _.set(
        result,
        "patchObject.AccountId",
        _.get(hullToSFObject, "AccountId")
      );
      result.hasChanges = true;
    }

    // Apply the identifier if we have changes detected,
    // but drop it if the actual salesforce object has none
    if (result.hasChanges === true) {
      if (_.has(existingSFObject, "Id")) {
        _.set(result.patchObject, "Id", _.get(existingSFObject, "Id"));
      }
    }

    return result;
  }
}

module.exports = PatchUtil;
