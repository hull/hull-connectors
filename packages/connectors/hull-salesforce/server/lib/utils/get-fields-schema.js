// @flow

const _ = require("lodash");
const Promise = require("bluebird");
const SalesforceClient = require("../service-client");

function getFieldsSchema(
  salesforceClient: SalesforceClient,
  mappings: Object
): Object {
  return Promise.all(
    _.map(mappings, ({ type }) => {
      return salesforceClient.fetchFieldsList(type).then(fields => {
        return { type: type.toLowerCase(), fields };
      });
    })
  ).then(fieldsByType => {
    return fieldsByType.reduce((schema, { fields, type }) => {
      return _.merge({}, schema, {
        [`${type}`]: _.map(fields, field => {
          return _.pick(field, ["name", "type"]);
        }).sort(),
        [`${type}_updateable`]: _.map(
          _.filter(fields, { updateable: true }),
          field => {
            return _.pick(field, ["name"]);
          }
        ).sort(),
        [`${type}_custom`]: _.map(_.filter(fields, { custom: true }), field => {
          return _.pick(field, ["name"]);
        }).sort(),
        [`${type}_unique`]: _.map(_.filter(fields, { unique: true }), field => {
          return _.pick(field, ["name"]);
        }).sort(),
        [`${type}_reference`]: _.map(
          _.filter(fields, { updateable: true, type: "reference" }),
          field => {
            return _.pick(field, ["name"]);
          }
        ).sort()
      });
    }, {});
  });
}

async function getResourceSchema(type: string, options: Object): Object {
  const fieldTypes = ["multipicklist"];

  const { cache, serviceClient, fetchResourceSchema } = options;

  if (!fetchResourceSchema) {
    return {};
  }

  let resourceSchema = await cache.get(`${type.toLowerCase()}Schema`);
  if (_.isNil(resourceSchema)) {
    resourceSchema = await serviceClient.fetchResourceSchema(type, fieldTypes);
    await cache.set(`${type.toLowerCase()}Schema`, resourceSchema, {
      ttl: 60000
    });
  }
  return resourceSchema;
}

module.exports = {
  getFieldsSchema,
  getResourceSchema
};
