/* global describe, it */
const assert = require("assert");
const Promise = require("bluebird");
const sinon = require("sinon");

const MailchimpAgent = require("../../server/lib/mailchimp-agent");


describe("MailchimpAgent", () => {
  return;
  describe("createAudience", () => {
    const hullStub = {
      logger: {
        info() {},
        debug() {}
      },
      get() {
        return test.hullSegments;
      }
    };

    it(`should return audience when there is an exisiting static segment in mailchimp`, () => {

      class MailchimpClientStub {
        batch() {
          return new Promise.resolve({ segments: [
            { name: "testSegment" }
          ] });
        }
        request() {
          return new Promise.resolve({ segments: [
            { name: "testSegment" }
          ] });
        }
      }

      const mailchimpAgent = new MailchimpAgent({}, hullStub, {}, MailchimpClientStub);

      return mailchimpAgent.createAudience({ name: "testSegment" })
        .then(res => {
          assert.deepEqual(res, { name: "testSegment" });
        });
    });

    it(`should create and return an audience when there is no an exisiting static segment`, () => {

      class MailchimpClientStub {}

      const mailchimpAgent = new MailchimpAgent({}, hullStub, {}, MailchimpClientStub);

      mailchimpAgent.request = sinon.stub();
      mailchimpAgent.saveAudienceMapping = sinon.stub();

      mailchimpAgent.request.onCall(0)
      .returns(new Promise.resolve({ segments: [] }));

      mailchimpAgent.request.onCall(1)
      .returns(new Promise.resolve({
        id: 123,
        name: 'test',
        type: 'static'
      }));

      mailchimpAgent.saveAudienceMapping.onCall(0)
        .returns((new Promise.resolve([])))

      return mailchimpAgent.createAudience({ name: "testSegment" }, false)
        .then(res => {
          assert.deepEqual(res, {
            id: 123,
            type: "static",
            name: "test"
          });
        });
    });
  });
});
