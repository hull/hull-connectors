const _ = require("lodash");
const { isValidMessage } = require("./validate");

const performTrigger = (validations) => ({ entityType, action }) => {
  return async (z, bundle) => {

    const cleanedRequest = _.get(bundle, "cleanedRequest", []);
    const messages = !_.isArray(cleanedRequest) ? [cleanedRequest] : cleanedRequest;

    const inputData = _.get(bundle, `inputData`, {});

    const filteredMessages = [];
    _.forEach(messages, message => {
      if (isValidMessage(message, inputData, validations)) {
        filteredMessages.push(message);
      }
    });

    return filteredMessages;
  };
};

module.exports = {
  performTrigger
};
