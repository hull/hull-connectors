import getUserChanges from "../../server/util/get-user-changes";
import _ from "lodash";

describe("Slack user segment entered test", () => {
  // segments the user is currently in
  const userSegmentIds = [
    "5c460f417b5385471e00002f",
    "5c50a5737fdb2fd3bc0000ec",
  ];

  const notify_segments = [
    {
      segment: "",
      channel: "",
    },
  ];

  const notify_events = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing",
      synchronized_segment: "5bffc38f625718d58b000004",
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing",
      synchronized_segment: "5c460f417b5385471e00002f",
    },
  ];

  const notify_events_undefined_segments = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing",
      synchronized_segment: undefined,
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing",
      synchronized_segment: undefined,
    },
  ];

  const notify_events_all_segments = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing",
      synchronized_segment: "ALL",
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing",
      synchronized_segment: "ALL",
    },
  ];

  it("user is not yet in segment and enters it. Segment entered is synchronized in settings", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        entered: [
          {
            id: "5bffc38f625718d58b000004",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "users_segment",
            created_at: "2018-11-29T10:46:39Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(changes, notify_segments, notify_events);

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(1);
    expect(entered[0]).toBe("#testing");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("user is not yet in segment and enters it. Segment entered is not synchronized in settings", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        entered: [
          {
            id: "random-segment",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "users_segment",
            created_at: "2018-11-29T10:46:39Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(changes, notify_segments, notify_events);

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(left.length).toBe(0);
    expect(entered.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("user is in segment and leaves. Segment left is synchronized in settings", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        left: [
          {
            id: "5c460f417b5385471e00002f",
            name: "Named Leads Intercom",
            updated_at: "2019-04-24T18:41:21Z",
            type: "users_segment",
            created_at: "2019-01-21T18:28:17Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(changes, notify_segments, notify_events);

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(left.length).toBe(1);
    expect(left[0]).toBe("#testing");

    expect(entered.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Left segment "Named Leads Intercom"');
  });

  it("user is in segment and leaves. Segment left is not synchronized in settings", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        left: [
          {
            id: "random-segment",
            name: "Named Leads Intercom",
            updated_at: "2019-04-24T18:41:21Z",
            type: "users_segment",
            created_at: "2019-01-21T18:28:17Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(changes, notify_segments, notify_events);

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(left.length).toBe(0);
    expect(entered.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Left segment "Named Leads Intercom"');
  });

  it("user is not yet in segment and enters it. Synchronized segments in settings are undefined", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        entered: [
          {
            id: "5bffc38f625718d58b000004",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "users_segment",
            created_at: "2018-11-29T10:46:39Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(
      changes,
      notify_segments,
      notify_events_undefined_segments
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(1);
    expect(entered[0]).toBe("#testing");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("user is in segment and leaves. Synchronized segments in settings are undefined", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        left: [
          {
            id: "5c460f417b5385471e00002f",
            name: "Named Leads Intercom",
            updated_at: "2019-04-24T18:41:21Z",
            type: "users_segment",
            created_at: "2019-01-21T18:28:17Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(
      changes,
      notify_segments,
      notify_events_undefined_segments
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(left.length).toBe(1);
    expect(left[0]).toBe("#testing");

    expect(entered.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Left segment "Named Leads Intercom"');
  });

  it("user is not yet in segment and enters it. Synchronized segments in settings are undefined", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        entered: [
          {
            id: "5bffc38f625718d58b000004",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "users_segment",
            created_at: "2018-11-29T10:46:39Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(
      changes,
      notify_segments,
      notify_events_undefined_segments
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(1);
    expect(entered[0]).toBe("#testing");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("user is not yet in segment and enters it. Synchronized segments in settings are ['ALL']", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        entered: [
          {
            id: "5bffc38f625718d58b000004",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "users_segment",
            created_at: "2018-11-29T10:46:39Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(
      changes,
      notify_segments,
      notify_events_all_segments
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(1);
    expect(entered[0]).toBe("#testing");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("user is in segment and leaves. Synchronized segments in settings are ['ALL']", () => {
    const changes = {
      is_new: false,
      user: {},
      account: {},
      segments: {
        left: [
          {
            id: "5c460f417b5385471e00002f",
            name: "Named Leads Intercom",
            updated_at: "2019-04-24T18:41:21Z",
            type: "users_segment",
            created_at: "2019-01-21T18:28:17Z",
          },
        ],
      },
      account_segments: {},
    };

    const response = getUserChanges(
      changes,
      notify_segments,
      notify_events_all_segments
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(left.length).toBe(1);
    expect(left[0]).toBe("#testing");

    expect(entered.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Left segment "Named Leads Intercom"');
  });
});
