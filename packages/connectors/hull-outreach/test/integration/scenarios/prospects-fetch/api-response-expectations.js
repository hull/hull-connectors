const _ = require("lodash");
const payloadAccounts = require("../../fixtures/api-responses/list-prospects.json");
const webhookResponse = require("../../fixtures/api-responses/create-webhook.json");

module.exports = nock => {
  nock("https://api.outreach.io")
  .post("/api/v2/webhooks/")
  .reply(201, webhookResponse);
  nock("https://api.outreach.io")
    .get("/api/v2/prospects/")
    .reply(200, payloadAccounts);
};
