/* @flow */

const _ = require("lodash");

function deduplicateEnvelopes(
  envelopes: Array<Object>,
  entity: string
): Array<Object> {
  if (!envelopes || !_.isArray(envelopes) || !_.size(envelopes) === 0) {
    return [];
  }

  return _.chain(envelopes)
    .groupBy(`message.${entity}.id`)
    .map(val => {
      return _.last(_.sortBy(val, [`message.${entity}.indexed_at`]));
    })
    .value();
}

module.exports = {
  deduplicateEnvelopes
};
