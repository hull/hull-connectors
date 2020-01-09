const _ = require("lodash");
const { subscribeUrl } = require("../config");

function getInputData(inputData, { entityType, action }) {
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
