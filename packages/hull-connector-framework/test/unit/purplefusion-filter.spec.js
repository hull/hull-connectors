/* @flow */
const _ = require("lodash");

const { toSendMessage } = require("../../src/purplefusion/utils");
const { ContextMock } = require("../../src/purplefusiontester/connector-mock");

describe("Outgoing User Segment Filtering Tests", () => {
  it("outgoing user all segments", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["ALL"],
        send_all_user_attributes: true
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" }
      })
    ).toEqual(true);
  });

  it("outgoing user segment", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        send_all_user_attributes: true
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" }
      })
    ).toEqual(true);
  });

  it("outgoing user all segments account attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["ALL"],
        outgoing_user_attributes: [{ hull: "account.domain", service: "field" }]
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(true);
  });

  it("outgoing user segment account attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_attributes: [{ hull: "account.domain", service: "field" }]
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(true);
  });

  it("outgoing user all segments user attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["ALL"],
        outgoing_user_attributes: [{ hull: "closeio/title", service: "field" }]
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" },
        changes: { user: { "closeio/title": [null, "sometitle"] } }
      })
    ).toEqual(true);
  });

  it("outgoing user segment user attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_attributes: [{ hull: "closeio/title", service: "field" }]
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" },
        changes: { user: { "closeio/title": [null, "sometitle"] } }
      })
    ).toEqual(true);
  });

  it("outgoing user entered segment", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["1234"] }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" },
        changes: { segments: { entered: [{ id: "1234" }] } }
      })
    ).toEqual(true);
  });

  // Test for sendOnAnySegmentChanges for cases that we're sending segments by default and we need to send on any change
  it("outgoing user send on sendOnAnySegmentChanges option(entered), for synching hull_segments", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["1234"] }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: { segments: { entered: [{ id: "1234" }] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(true);
  });

  it("outgoing user send on sendOnAnySegmentChanges option(left), for synching hull_segments", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["1234"] }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: { segments: { left: [{ id: "1234" }] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(true);
  });

  it("outgoing user send on sendOnAnySegmentChanges option, no changed segments", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["1234"] }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: { account: { domain: [null, "somedomain.com"] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(false);
  });

  //testing on account link changes (different identifiers can be an account link change)
  it("outgoing user account link changes", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        link_users_in_service: true
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: { account: { id: [null, "1234"] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(true);
  });

  it("outgoing user service account id changes", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        link_users_in_service: true
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: { account: { "hubspot/id": [null, "1234"] } }
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(true);
  });

  // must specify a service name to know what attribute to check on the account
  it("outgoing user service account id changes, but no serviceName specified", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        link_users_in_service: true
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" },
        changes: { account: { "hubspot/id": [null, "1234"] } }
      })
    ).toEqual(false);
  });

  it("outgoing user specified associated account id changes at account level", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_associated_account_id: "account.salesforce/someid"
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" },
        changes: { account: { "salesforce/someid": ["asdf", "1234"] } }
      })
    ).toEqual(true);
  });

  it("outgoing user specified associated account id changes at user level", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_associated_account_id: "salesforce/someid"
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" },
        changes: { user: { "salesforce/someid": ["asdf", "1234"] } }
      })
    ).toEqual(true);
  });

  it("outgoing user deleted in service", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        ignore_deleted_users: false
      }
    });
    const options = { serviceName: "hubspot" };
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [],
          user: {
            email: "someuser@gmail.com",
            "hubspot/deleted_at": "1-1-2019"
          },
          changes: { segments: { entered: [{ id: "1234" }] } }
        },
        options
      )
    ).toEqual(true);
  });

  // negative tests
  it("outgoing user all segments no attribute changes", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["ALL"] }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" }
      })
    ).toEqual(false);
  });

  it("outgoing user segment no attribute changes", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["1234"] }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" }
      })
    ).toEqual(false);
  });

  it("outgoing user all segments different account attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["ALL"],
        outgoing_user_attributes: [
          { hull: "account.closeio/status", service: "field" }
        ]
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(false);
  });

  it("outgoing user segment account attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_attributes: [
          { hull: "account.closeio/status", service: "field" }
        ]
      }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [{ id: "1234" }],
        user: { email: "someuser@gmail.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(false);
  });

  it("outgoing user entered not synchronized segment", () => {
    const context = new ContextMock({
      private_settings: { synchronized_user_segments: ["1234"] }
    });
    expect(
      toSendMessage(context, "user", {
        segments: [],
        user: { email: "someuser@gmail.com" },
        changes: { segments: { entered: [{ id: "567" }] } }
      })
    ).toEqual(false);
  });

  it("outgoing user is has not been sync'd with service yet, does not have service id, so push it", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_attributes: [{ hull: "closeio/title", service: "field" }]
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        { segments: [{ id: "1234" }], user: { email: "someuser@gmail.com" } },
        { serviceName: "hubspot" }
      )
    ).toEqual(true);
  });

  it("outgoing user has a service id, but no changes, so don't sync", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_attributes: [{ hull: "closeio/title", service: "field" }]
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com", "hubspot/id": 5678 }
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(false);
  });

  it("outgoing user deleted in service", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        ignore_deleted_users: true
      }
    });
    const options = { serviceName: "hubspot" };
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [],
          user: {
            email: "someuser@gmail.com",
            "hubspot/deleted_at": "1-1-2019"
          },
          changes: { segments: { entered: [{ id: "1234" }] } }
        },
        options
      )
    ).toEqual(false);
  });

  // Edge case, in the future we may decide to send this maybe, but no outgoing attributes...
  // but is in segment
  it("outgoing user is has not been sync'd with service yet, is in a synchronized segment, has no outgoing attributes, does not have service id, so push it", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        outgoing_user_attributes: []
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        { segments: [{ id: "1234" }], user: { email: "someuser@gmail.com" } },
        { serviceName: "hubspot" }
      )
    ).toEqual(false);
  });

  it("outgoing user do not send if only account changes even if send_all_user_attributes option set", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        send_all_user_attributes: true
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: {
            account: { type: [null, "financial"] },
            user: {},
            events: []
          }
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(false);
  });

  it("outgoing user send if user changes if send_all_user_attributes option set", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        send_all_user_attributes: true
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: {
            account: { type: [null, "financial"] },
            user: { title: [null, "ceo"] },
            events: []
          }
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(true);
  });

  it("outgoing user send if events if send_all_user_attributes option set", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_user_segments: ["1234"],
        send_all_user_attributes: true
      }
    });
    expect(
      toSendMessage(
        context,
        "user",
        {
          segments: [{ id: "1234" }],
          user: { email: "someuser@gmail.com" },
          changes: { account: { type: [null, "financial"] }, user: {} },
          events: [{ event_id: 1 }]
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(true);
  });
});

describe("Outgoing Account Segment Filtering Tests", () => {
  it("outgoing account all segments", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["ALL"],
        send_all_account_attributes: true
      }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [],
        account: { domain: "somedomain.com" }
      })
    ).toEqual(true);
  });

  it("outgoing account segment", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["1234"],
        send_all_account_attributes: true
      }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [{ id: "1234" }],
        account: { email: "somedomain.com" }
      })
    ).toEqual(true);
  });

  it("outgoing account all segments account attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["ALL"],
        outgoing_account_attributes: [{ hull: "domain", service: "field" }]
      }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [],
        account: { domain: "somedomain.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(true);
  });

  it("outgoing account segment account attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["1234"],
        outgoing_account_attributes: [{ hull: "domain", service: "field" }]
      }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [{ id: "1234" }],
        account: { domain: "somedomain.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(true);
  });

  it("outgoing account entered segment", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["1234"] }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [],
        account: { domain: "somedomain.com" },
        changes: { account_segments: { entered: [{ id: "1234" }] } }
      })
    ).toEqual(true);
  });

  // Test for sendOnAnySegmentChanges for cases that we're sending segments by default and we need to send on any change
  it("outgoing account send on sendOnAnySegmentChanges option(entered), for synching hull_segments", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["1234"] }
    });
    expect(
      toSendMessage(
        context,
        "account",
        {
          account_segments: [{ id: "1234" }],
          account: { domain: "somedomain.com" },
          changes: { account_segments: { entered: [{ id: "5678" }] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(true);
  });

  it("outgoing account send on sendOnAnySegmentChanges option(left), for synching hull_segments", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["1234"] }
    });
    expect(
      toSendMessage(
        context,
        "account",
        {
          account_segments: [{ id: "1234" }],
          account: { domain: "somedomain.com" },
          changes: { account_segments: { left: [{ id: "5678" }] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(true);
  });

  it("outgoing account send on sendOnAnySegmentChanges option, no changed segments", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["1234"] }
    });
    expect(
      toSendMessage(
        context,
        "account",
        {
          account_segments: [{ id: "1234" }],
          account: { domain: "somedomain.com" },
          changes: { account: { domain: [null, "somedomain.com"] } }
        },
        { sendOnAnySegmentChanges: true }
      )
    ).toEqual(false);
  });

  // negative tests
  it("outgoing account all segments no attribute changes", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["ALL"] }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [],
        account: { domain: "somedomain.com" }
      })
    ).toEqual(false);
  });

  it("outgoing account segment no attribute changes", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["1234"] }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [{ id: "1234" }],
        account: { domain: "somedomain.com" }
      })
    ).toEqual(false);
  });

  it("outgoing  all segments different attribute change", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["ALL"],
        outgoing_account_attributes: [
          { hull: "closeio/status", service: "field" }
        ]
      }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: [],
        account: { domain: "somedomain.com" },
        changes: { account: { domain: [null, "somedomain.com"] } }
      })
    ).toEqual(false);
  });

  it("outgoing account entered not synchronized segment", () => {
    const context = new ContextMock({
      private_settings: { synchronized_account_segments: ["1234"] }
    });
    expect(
      toSendMessage(context, "account", {
        account_segments: ["1234"],
        account: { domain: "somedomain.com" },
        changes: { segments: { entered: [{ id: "567" }] } }
      })
    ).toEqual(false);
  });

  it("outgoing account does not have service id, but is in segment so push", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["1234"],
        outgoing_account_attributes: [{ hull: "domain", service: "field" }]
      }
    });
    expect(
      toSendMessage(
        context,
        "account",
        {
          account_segments: [{ id: "1234" }],
          account: { domain: "somedomain.com" }
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(true);
  });

  it("outgoing account has service id, but no changes, so don't push", () => {
    const context = new ContextMock({
      private_settings: {
        synchronized_account_segments: ["1234"],
        outgoing_account_attributes: [{ hull: "domain", service: "field" }]
      }
    });
    expect(
      toSendMessage(
        context,
        "account",
        {
          account_segments: [{ id: "1234" }],
          account: { domain: "somedomain.com", "hubspot/id": 5678 }
        },
        { serviceName: "hubspot" }
      )
    ).toEqual(false);
  });
});
