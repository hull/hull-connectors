/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

const expect = require("expect");

describe("Intercom Webhook Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../../server/glue"),
    {
      intercom: require("../../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(
      require("../../../server/transforms-to-hull"),
      require("../../../server/transforms-to-service")
    ),
    "ensure");

  expect.extend({
    toBeWithinRange(received, floor, ceiling) {
      const pass = received >= floor && received <= ceiling;
      if (pass) {
        return {
          message: () =>
            `expected ${received} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },
  });

  const run = false;
  // Save Leads/Contacts Webhook actions

  it("company.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-company-created"));
  });

  it("contact.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-created"));
  });

  it("user.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-created"));
  });

  it("user.deleted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-deleted"));
  });

  it("user.deleted webhook - not whitelisted - webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-deleted-not-whitelisted"));
  });

  // Webhook Event Actions
  it("conversation.admin.replied webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-replied"));
  });

  it("conversation.admin.single.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-single-created"));
  });

  // TODO CHECK IF THIS IS A REAL CASE:
  it("conversation.admin.single.created - lead - webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-single-created-lead"));
  });

  it("conversation.admin.assigned webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-assigned"));
  });

  it("conversation.admin.assigned - to unknown - webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-assigned-to-unknown"));
  });

  it("conversation.admin.closed webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-closed"));
  });

  it("conversation.admin.opened - no admin assigned - webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-opened-no-admin"));
  });

  it("conversation.admin.opened wehbook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-opened"));
  });

  it("conversation.admin.noted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-noted"));
  });

  it("conversation.admin.snoozed webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-snoozed"));
  });

  it("conversation.admin.unsnoozed webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-admin-unsnoozed"));
  });

  it("conversation_part.tag.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-part-tag-created"));
  });

  it("conversation_part.redacted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-conversation-part-redacted"));
  });

  // TODO fill out test
  it("conversation.user.created", () => {});
  // TODO fill out test
  it("conversation.user.replied", () => {});
  // TODO fill out test
  it("user.unsubscribed webhook", () => {});

  it("user.tag.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-tag-created"));
  });

  it("user.tag.deleted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-tag-deleted"));
  });

  it("contact.tag.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-tag-created"));
  });

  it("contact.tag.deleted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-tag-deleted"));
  });

  it("user.email.updated webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-email-updated"));
  });

  it("contact.added_email webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-added-email"));
  });

  /*
  TODO Add support for these webhooks
  it("contact.signed_up webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-signed-up"));
  });

  it("visitor.signed_up webhook", () => {
    return harness.runTest(require("./fixtures/webhook-visitor-signed-up"));
  });
  */
});
