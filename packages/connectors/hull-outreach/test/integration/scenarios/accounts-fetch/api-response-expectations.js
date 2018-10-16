const _ = require("lodash");
const payloadAccounts = require("../../fixtures/api-responses/list-accounts.json");
const webhookResponse = require("../../fixtures/api-responses/create-webhook.json");

module.exports = nock => {
  nock("https://api.outreach.io")
    .get("/api/v2/accounts/")
    .reply(200, payloadAccounts);
  nock("https://api.outreach.io")
    .post("/api/v2/webhooks/")
    .reply(200, webhookResponse);
};
