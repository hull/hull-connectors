import Analytics from "analytics-node";

module.exports = function analyticsClientFactory() {
  const analytics = {};
  return function analyticsClient(write_key) {
    const a = analytics[write_key];
    if (!a) analytics[write_key] = new Analytics(write_key);
    return analytics[write_key];
  };
};
