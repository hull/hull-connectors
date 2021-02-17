const {
  removeTraitsPrefix
} = require("hull-connector-framework/src/purplefusion/utils");

function normalizeFieldName(fieldname) {
  const normalizedFieldName = fieldname
    .replace(/\//g, "_")
    .replace(/-/g, "_")
    .replace(/\./g, "_")
    .replace(/\s/g, "_");
  const finalFieldName = removeTraitsPrefix(normalizedFieldName);

  if(finalFieldName.length >= 64) {
    return finalFieldName.substr(0,63);
  }
  return finalFieldName;
}

module.exports = { normalizeFieldName };
