//@noflow
import _ from "lodash";
import format from "./format-value";

module.exports = function formatEventProperties(props = {}) {
  return _.map(
    format(_.fromPairs(_.map(props, p => [p.field_name, p.text_value]))),
    prop => {
      return { value: `*${prop.title}: * ${prop.value}`, short: false };
    }
  );
};

// module.exports = function formatEventProperties(props = {}) {
//   return _.join(
//     _.map(
//       format(
//         _.fromPairs(
//           _.map(props, p => [p.field_name, p.text_value])
//         )
//       ), p => `*${p.title}*: ${p.value}`
//     )
//   , "\n");
// };
