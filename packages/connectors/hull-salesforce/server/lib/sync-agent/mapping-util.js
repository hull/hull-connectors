/* @flow */
/* eslint-disable */
const _ = require("lodash");

const { DEFAULT_MAPPING } = require("./mappings");

export type RecordType = "Account" | "Lead" | "Contact" | "Task";

type Mapping = {
  type: RecordType,
  fetchFields: any,
  fields: any,
  fetchFieldsToTopLevel: any
};

type Ship = {
  private_settings: any
};

type Field = {
  key: string,
  overwrite: boolean,
  defaultValue?: any
};

const getTypes = (): Array<RecordType> => _.keys(DEFAULT_MAPPING)

/**
 * Returns a mapping between Salesforce attributes and Hull top level
 * traits for the given Salesforce record type.
 * @param {String} type Salesforce record type (Lead | Contact).
 * @return {Object} Salesforce attributes names to Hull top level trait names.
 */
function getServiceAttributeToHullTopLevel(type: RecordType) {
  return _.mapValues(
    _.keyBy(_.get(DEFAULT_MAPPING, type, []), "service"),
    mapping => mapping.hull_top_level_trait
  );
}

/**
 * Returns a mapping between Salesforce attributes and Salesforce traits into
 * Hull for the given Salesforce record type.
 * @param {String} type Salesforce record type (Lead | Contact).
 * @return {Object} Salesforce attributes names to Salesforce traits names in
 *                  Hull (without "salesforce_{lead|contact}/" prefix).
 */
function getServiceAttributeToHullTrait(type: RecordType) {
  return _.mapValues(
    _.keyBy(_.get(DEFAULT_MAPPING, type, []), "service"),
    mapping => mapping.hull
  );
}

function getFieldsMapping(ship: Ship, type: RecordType): Mapping {
  const fieldsList =
    ship.private_settings[`${type.toLowerCase()}_attributes_outbound`];

  // Fetch all default salesforce attributes
  const defaultServiceAttributesToHullTrait = getServiceAttributeToHullTrait(
    type
  );
  const defaultServiceAttributesToHullTopLevel = getServiceAttributeToHullTopLevel(
    type
  );
  // Fetch custom salesforce attributes defined
  const settingsServiceAttributesToHullTrait = (
    ship.private_settings[`${type.toLowerCase()}_attributes_inbound`] || []
  ).reduce(function setNullValue(result, field) {
    // Do not map custom attributes to hull top level properties
    if (_.isEmpty(field.service)) {
      return result;
    }
    result[field.service] = null;
    return result;
  }, {});

  const fetchFields = _.merge(
    defaultServiceAttributesToHullTrait,
    settingsServiceAttributesToHullTrait
  );

  const fields = {};
  if (fieldsList && fieldsList.length > 0) {
    fieldsList.forEach(field => {
      const f: Field = { key: field.hull, overwrite: !!field.overwrite };
      if (field.default_value && field.default_value.length > 0) {
        f.defaultValue = field.default_value;
      }
      if (
        field.service !== undefined &&
        f !== undefined &&
        f.key !== undefined
      ) {
        fields[field.service] = f;
      }
    });
  }

  return {
    type,
    fetchFields,
    fields,
    fetchFieldsToTopLevel: defaultServiceAttributesToHullTopLevel
  };
}

function getMappings(ship: Ship) {
  return getTypes().reduce((memo, type) => {
    memo[type] = getFieldsMapping(ship, type);
    return memo;
  }, {});
}

module.exports = {
  getMappings
};
