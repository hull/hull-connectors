/* @flow */

const _ = require("lodash");

function deduplicateMessages(
  messages: Array<Object>,
  entity: string
): Array<Object> {
  if (!messages || !_.isArray(messages) || messages.length === 0) {
    return [];
  }

  return _.chain(messages)
    .groupBy(`${entity}.id`)
    .map(val => {
      return _.last(_.sortBy(val, [`${entity}.indexed_at`]));
    })
    .value();
}

module.exports = {
  deduplicateMessages
};
