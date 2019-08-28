/* @flow */
const _ = require("lodash");

const {
  HullOutgoingUser
} = require("./hull-service-objects");

function filteredMessageCallback(dispatcher, dispatchPromise, objectType, dataToSkip) {

  let promiseToReturn = dispatchPromise;

  _.forEach(dataToSkip, dataToSkipElement => {
    if (objectType === HullOutgoingUser && dataToSkipElement.changes && dataToSkipElement.changes.is_new) {
      if (_.isEmpty(_.get(dataToSkipElement, "user.email"))
        && _.get(dataToSkipElement.user, "outreach/created_by_webhook") === true
        && _.get(dataToSkipElement.user, "outreach/id")) {
        promiseToReturn = promiseToReturn.then(() => {
          return dispatcher.dispatchWithData(context, "getProspectById", objectType, dataToSkipElement);
        });
      }
    }
  });

  return promiseToReturn;
}

module.exports = filteredMessageCallback;
