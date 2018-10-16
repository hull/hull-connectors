const _ = require("lodash");
const payload = require("../../fixtures/api-responses/contact-post.json");
const payloadStatus = require("../../fixtures/api-responses/list-leadstatus.json");
const payloadFields = require("../../fixtures/api-responses/list-leadfields.json");

module.exports = nock => {
  const respPayload = _.cloneDeep(payload);
  _.set(respPayload, "name", "Sven Maschek");
  _.set(respPayload, "emails", [{ email: "sven@hull.io", type: "office" }]);
  _.unset(respPayload, "title");
  _.set(respPayload, "phones", []);
  _.set(respPayload, "urls", []);
  nock("https://app.close.io/")
    .post(/\/api\/v1\/contact\//)
    .reply(200, respPayload);

  nock("https://app.close.io/")
    .get(/\/api\/v1\/status\/lead\//)
    .reply(200, payloadStatus);

  nock("https://app.close.io/")
    .get(/\/api\/v1\/custom_fields\/lead\//)
    .reply(200, payloadFields);
};
