/* global it, describe */
const { expect } = require("chai");
const sinon = require("sinon");

const HullClient = require("../../src/index");

const config = {
  id: "550964db687ee7866d000057",
  secret: "abcd12345",
  organization: "hull-demos"
};

describe("HullClient array capture feature", () => {
  it("should allow to capture traits", () => {
    const clock = sinon.useFakeTimers();
    const hullClient = new HullClient({ ...config, captureFirehoseEvents: true });
    hullClient.configuration().firehoseEvents.push("test");
    return Promise.all([
      hullClient.asUser({ email: "foo@bar.com" }).traits({ coconuts: 123 }),
      hullClient.asUser({ email: "zoo@bay.com" }).traits({ apples: 345 })
    ]).then(() => {
      hullClient.configuration().firehoseEvents.push("test");
      expect(hullClient.configuration().firehoseEvents).to.eql([
        {
          context: {
            organization: "hull-demos",
            id: "550964db687ee7866d000057",
            subject_type: "user",
            user_email: "foo@bar.com"
          },
          data: {
            type: "traits",
            body: { coconuts: 123 }
          }
        },
        {
          context: {
            organization: "hull-demos",
            id: "550964db687ee7866d000057",
            subject_type: "user",
            user_email: "zoo@bay.com"
          },
          data: {
            type: "traits",
            body: { apples: 345 }
          }
        }
      ]);
      clock.restore();
    });
  });

  it("should allow to capture logs", () => {
    const clock = sinon.useFakeTimers();
    const hullClient = new HullClient({ ...config, captureLogs: true });
    hullClient.logger.info("test", { foo: "bar" });
    const b =hullClient.configuration().logs;
    expect(hullClient.configuration().logs).to.eql([
      {
        context: {
          "connector": "550964db687ee7866d000057",
          organization: "hull-demos"
        },
        data: { foo: "bar" },
        level: "info",
        message: "test",
        timestamp: "1970-01-01T00:00:00.000Z"
      }
    ]);

    // then log as user
    hullClient.asUser({ email: "foo@bar.com" }).logger.info("outgoing.user.success", { baz: "bay" });
    expect(hullClient.configuration().logs).to.eql([
      {
        context: {
          connector: "550964db687ee7866d000057",
          organization: "hull-demos"
        },
        data: { foo: "bar" },
        level: "info",
        message: "test",
        timestamp: "1970-01-01T00:00:00.000Z"
      },
      {
        message: "outgoing.user.success",
        level: "info",
        data: { baz: "bay" },
        context: {
          connector: "550964db687ee7866d000057",
          organization: "hull-demos",
          subject_type: "user",
          user_email: "foo@bar.com"
        },
        timestamp: "1970-01-01T00:00:00.000Z"
      }
    ]);
    clock.restore();
  });
});
