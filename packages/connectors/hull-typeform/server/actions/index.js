/* eslint-disable global-require */
module.exports = {
  authorization: require("./authorization"),
  fetchAllResponses: require("./fetch-all-responses"),
  fetchRecentResponses: require("./fetch-recent-responses"),
  getForms: require("./get-forms"),
  getQuestions: require("./get-questions"),
  getEmailQuestions: require("./get-email-questions"),
  refreshAccessToken: require("./refresh-access-token")
};
