/* global describe, it */
const assert = require("assert");
const Promise = require("bluebird");

const MailchimpAgent = require("../../server/lib/mailchimp-agent");
const ClientMock = require("./support/client-mock");

describe("MailchimpAgent", () => {
  const client = ClientMock();
  const ship = {
    private_settings: {
      mailchimp_list_id: "test"
    }
  };

  return;
  describe("fetchAudiencesBySegmentId", () => {
    const tests = [
      {
        caseDescription: "one hull segment and mapped mailchimp segment",
        hullSegments: [{ name: "testSegment", id: "hullSegmentId" }],
        mailchimpSegments: { segments: [
          { name: "Test Mailchimp Segment", id: "MailchimpSegmentId" }
        ] },
        shipPrivateSettings: {
          segment_mapping: {
            hullSegmentId: "MailchimpSegmentId"
          }
        },
        result: {
          hullSegmentId: {
            segment: { name: "testSegment", id: "hullSegmentId" },
            audience: { name: "Test Mailchimp Segment", id: "MailchimpSegmentId" }
          }
        }
      },
      {
        caseDescription: "two hull segments without mapped mailchimp segment",
        hullSegments: [
          { name: "testSegment", id: "hullSegmentId" },
          { name: "Second Test Segment", id: "secondHullSegmentId" }
        ],
        mailchimpSegments: { segments: [] },
        shipPrivateSettings: {
          segment_mapping: {
            hullSegmentId: "MailchimpSegmentId"
          }
        },
        result: {
          hullSegmentId: {
            segment: { name: "testSegment", id: "hullSegmentId" },
            audience: undefined
          },
          secondHullSegmentId: {
            segment: { name: "Second Test Segment", id: "secondHullSegmentId" },
            audience: undefined
          }
        }
      },
    ];

    tests.forEach(function eachTestCase(test) {
      it(`should handle following case: ${test.caseDescription}`, () => {
        class MailchimpClientStub {
          request() {
            return new Promise.resolve(test.mailchimpSegments);
          }
        }

        const hullStub = {
          logger: {
            info() {},
            debug() {}
          },
          get() {
            return test.hullSegments;
          }
        };

        const reqStub = {};

        const shipStub = {
          private_settings: test.shipPrivateSettings
        };

        const mailchimpAgent = new MailchimpAgent(shipStub, { client, ship });

        return mailchimpAgent.fetchAudiencesBySegmentId()
        .then(res => {
          assert.deepEqual(res, test.result);
        });
      });
    });
  });
});
