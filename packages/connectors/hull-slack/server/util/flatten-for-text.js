import _ from "lodash";

const flattenForText = (array = []) => _.map(array, e => `"${e}"`).join(", ");

module.exports = flattenForText;
