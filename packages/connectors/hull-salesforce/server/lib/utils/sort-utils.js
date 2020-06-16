/* @flow */

const _ = require("lodash");

type TSortResults = {
  toInsert: Array<Object>,
  toUpdate: Array<Object>,
  toSkip: Array<Object>,
};

function sortSfObjects(options: Object = {}, envelopes: Array<Object>, existingSfObjects: Array<Object>): TSortResults {
  const results: TSortResults = {
    toSkip: [],
    toUpdate: [],
    toInsert: []
  };

  const sfExternalIdentifier = _.get(options, "salesforce_external_id", null);
  if (sfExternalIdentifier === null) {
    return results;
  }

  // hull events that have been transformed into a sf service object
  const transformedEvents = _.map(envelopes, "transformedEvent");
  _.forEach(transformedEvents, (transformedEvent) => {
    const sfTask = _.find(existingSfObjects, (existingSfObject) => {
      return _.get(existingSfObject, sfExternalIdentifier) === _.get(transformedEvent, sfExternalIdentifier);
    });

    if (!_.isNil(sfTask)) {
      _.set(transformedEvent, "Id", _.get(sfTask, "Id"));
      results.toUpdate.push(transformedEvent);
    } else {
      results.toInsert.push(transformedEvent);
    }
  });

  return results;
}

module.exports = {
  sortSfObjects
};
