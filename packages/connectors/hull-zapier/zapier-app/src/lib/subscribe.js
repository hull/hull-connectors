const _ = require("lodash");
const { subscribeUrl } = require("../config");

function getInputData(inputData, { entityType, action }) {

  if (entityType === "user") {

    const user_segments = _.get(inputData, "user_segments", []);
    const user_attributes = _.get(inputData, "user_attributes", []);
    const account_segments = _.get(inputData, "account_segments", []);
    const account_attributes = _.get(inputData, "account_attributes", []);

    if (action === "attribute_updated") {
      return {
        user_segments,
        user_attributes,
        account_segments,
        account_attributes
      }
    }
  }
  return inputData;
}

function subscribe({ entityType, action }) {
  return async (z, bundle) => {
    const { targetUrl } = bundle;
    const inputData = getInputData(_.get(bundle, "inputData", {}), { entityType, action });

    const response = await z.request({
      url: subscribeUrl,
      body: {
        url: targetUrl,
        action,
        entityType,
        inputData
      },
      method: "POST"
    });
    return response.json;
  };
}

module.exports = {
  subscribe
};
