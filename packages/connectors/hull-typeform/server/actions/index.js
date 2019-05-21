/* eslint-disable global-require */
module.exports = {
  onAuthorize: require("./on-authorize"),
  status: require("./status"),
  credentialStatus: require("./credentials-status"),
  fetchAllResponses: require("./fetch-all-responses"),
  fetchRecentResponses: require("./fetch-recent-responses"),
  getForms: require("./get-forms"),
  getQuestions: require("./get-questions"),
  getEmailQuestions: require("./get-email-questions"),
  refreshAccessToken: require("./refresh-access-token")
};
