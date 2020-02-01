const _ = require("lodash");
const jsonata = require("jsonata");
const { getEntityAttributes } = require("./hull-service");

const attributeTransformation = jsonata(`[$.{"label": name, "key": $string($substringBefore(name, ".") & "__" & $substringAfter(name, "."))}]`);

function getOutputFields(entities) {
  return async (z, _bundle) => {
    let schemaFields = [];
    for (let i = 0; i < entities.length; i++) {
      const entityType = entities[i];
      const entitySchema = await getEntityAttributes(z, entityType);
      schemaFields = _.concat(schemaFields, attributeTransformation.evaluate(entitySchema));
    }
    return schemaFields;
  };
}

function empty() {
  return async (z, _bundle) => {
    return [];
  };
}

const getUserAttributeOutputFields = getOutputFields(["user", "account"]);
const getAccountAttributeOutputFields = getOutputFields(["account"]);
const getEmpty = empty();

module.exports = {
  getEmpty,
  getUserAttributeOutputFields,
  getAccountAttributeOutputFields
};
