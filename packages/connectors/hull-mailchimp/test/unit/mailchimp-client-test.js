/* global describe, it */
const assert = require("assert");
const Promise = require("bluebird");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

describe("MailchimpClient", () => {
  return;
  describe("batch", () => {
    it(`should return an array in microbatch in successfull query`, () => {
      class MailchimpStub {
        request(params) {
          return new Promise.resolve({ res: "test" });
        }
      }
      const MailchimpClient = proxyquire("../server/lib/mailchimp-client", { 'mailchimp-api-v3': MailchimpStub }).default;

      const mailchimpClient = new MailchimpClient({});

      return mailchimpClient.batch([{ path: "test", method: "get" }])
        .then(res => {
          assert.deepEqual(res, [{ res: "test" }]);
        });
    });

    it(`should return an error in microbatch in rejected query`, () => {

      class MailchimpStub {
        request(params) {
          return new Promise.reject("Internal server error");
        }
      }
      const MailchimpClient = proxyquire("../server/lib/mailchimp-client", { 'mailchimp-api-v3': MailchimpStub }).default;

      const mailchimpClient = new MailchimpClient({});

      return mailchimpClient.batch([{ path: "test", method: "get" }])
        .then(res => {
          assert.deepEqual(res, ["Internal server error"]);
        });
    });
  });
});
