/* eslint-disable global-require */
module.exports = {
  handleMailchimpBatch: require("./handle-mailchimp-batch"),
  importUsers: require("./import-users"),
  fetchAllUsers: require("./fetch-all-users"),
  syncOut: require("./sync-out"),
  trackUsers: require("./track-users"),
  track: require("./track"),
  trackEmailActivites: require("./track-email-activites")
};
