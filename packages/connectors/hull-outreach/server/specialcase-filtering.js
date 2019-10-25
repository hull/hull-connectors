/* @flow */
const _ = require("lodash");

const {
  HullOutgoingUser
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

function filteredMessageCallback(context, dispatcher, dispatchPromise, objectType, dataToSkip) {

  const prospectsToLookup = [];
  _.forEach(dataToSkip, dataToSkipElement => {
    if (objectType === HullOutgoingUser && dataToSkipElement.changes && dataToSkipElement.changes.is_new) {
      if (_.isEmpty(_.get(dataToSkipElement, "user.email"))
        && _.get(dataToSkipElement.user, "outreach/created_by_webhook") === true
        && _.get(dataToSkipElement.user, "outreach/id")) {
        prospectsToLookup.push(dataToSkipElement);
      }
    }
  });

  if (!_.isEmpty(prospectsToLookup)) {
    return dispatchPromise.then(results => {
      return dispatcher.dispatchWithData(context, "getProspectsById", objectType, prospectsToLookup)
        .then(() => {
          // return the original results
          return Promise.resolve(results);
        });
    });
  }

  return dispatchPromise;
}

module.exports = filteredMessageCallback;
