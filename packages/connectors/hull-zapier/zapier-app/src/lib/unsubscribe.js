const { unsubscribeUrl } = require("../config");

function unsubscribe({ entityType, action }) {
  return async (z, bundle) => {
    const { targetUrl } = bundle;
    const response = await z.request({
      url: unsubscribeUrl,
      body: {
        url: targetUrl,
        action,
        entityType
      },
      method: "DELETE"
    });
    return response.json;
  };
}

module.exports = {
  unsubscribe
};
