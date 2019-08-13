const {
  removeTraitsPrefix
} = require("hull-connector-framework/src/purplefusion/utils");

function normalizeFieldName(fieldname) {
  const normalizedFieldName = fieldname
    .replace(/\//g, "_")
    .replace(/-/g, "_")
    .replace(/\./g, "_")
    .replace(/\s/g, "_");
  return removeTraitsPrefix(normalizedFieldName);
}

module.exports = { normalizeFieldName };
