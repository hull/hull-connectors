const _ = require("lodash");
const payload = require("../../fixtures/api-responses/lead-put.json");
const payloadStatus = require("../../fixtures/api-responses/list-leadstatus.json");
const payloadFields = require("../../fixtures/api-responses/list-leadfields.json");

module.exports = nock => {
  const respPayload = _.cloneDeep(payload);
  _.set(respPayload, "display_name", "Madkudu");
  _.set(respPayload, "name", "Madkudu");
  _.set(respPayload, "url", "madkudu.com");
  _.set(respPayload, "contacts", []);
  nock("https://app.close.io/")
    .put(/\/api\/v1\/lead\//)
    .reply(200, respPayload);

  nock("https://app.close.io/")
    .get(/\/api\/v1\/status\/lead\//)
    .reply(200, payloadStatus);

  nock("https://app.close.io/")
    .get(/\/api\/v1\/custom_fields\/lead\//)
    .reply(200, payloadFields);
};
