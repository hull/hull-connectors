const nock = require("nock");

module.exports = function mocks() {
  return {
    setUpGetClientNock: answers =>
      nock("https://api.typeform.com")
      .get("/v1/form/123456789")
      .query(true)
      .reply(200, {
        responses: [
          {
            token: "67584930201",
            metadata: {
              user_agent: "hull",
              referer: "referer"
            },
            hidden: {
              typeform_id: "1234567890987654321",
              notchoice_3: "notchoice_value"
            },
            answers
          }
        ]
      })
  };
};
