const _ = require("lodash");
const payload = require("../../fixtures/api-responses/lead-post.json");
const payloadStatus = require("../../fixtures/api-responses/list-leadstatus.json");
const payloadFields = require("../../fixtures/api-responses/list-leadfields.json");

module.exports = nock => {
  const respPayload = _.cloneDeep(payload);
  _.set(respPayload, "display_name", "Madkudu");
  _.set(respPayload, "name", "Madkudu");
  _.set(respPayload, "url", "madkudu.com");
  _.set(respPayload, "contacts", []);
  nock("https://api.outreach.io/")
    .post(/\/api\/v2\/lead\//)
    .reply(200, respPayload);

  nock("https://api.outreach.io/")
    .get(/\/api\/v2\/status\/lead\//)
    .reply(200, payloadStatus);

  nock("https://api.outreach.io/")
    .get(/\/api\/v2\/custom_fields\/lead\//)
    .reply(200, payloadFields);
};
