const { getSegmentChanges } = require("../../server/utils/get-segment-changes");

describe("Slack User Entered Segment Tests", () => {

  it("User enters whitelisted segment. Should return event", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        entered: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
        ],
      },
      account_segments: {}
    };

    const event = "ENTERED_USER_SEGMENT";
    const synchronized_segment = "segment_1";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Entered User Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      }
    ]);
  });

  it("User enters 'ALL' whitelisted segment. Should return multiple events", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        entered: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
          {
            id: "segment_2",
            name: "Segment2",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          }
        ],
      },
      account_segments: {}
    };

    const event = "ENTERED_USER_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(2);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Entered User Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      },
      {
        "event": {
          "event": "Entered User Segment"
        },
        "segment": {
          "id": "segment_2",
          "name": "Segment2",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      }
    ]);
  });

  it("User enters 'ALL' segment. Should return event", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        entered: [
          {
            id: "user_segment_1",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
        ],
      },
      account_segments: {}
    };

    const event = "ENTERED_USER_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Entered User Segment"
        },
        "segment": {
          "id": "user_segment_1",
          "name": "Smugglers",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      }
    ]);
  });

  it("User enters non whitelisted segment. Should not return event", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        entered: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
        ],
      },
      account_segments: {}
    };

    const event = "ENTERED_USER_SEGMENT";
    const synchronized_segment = "random";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(0);
    expect(segmentMatches).toEqual([]);
  });
});

describe("Slack User Left Segment Tests", () => {

  it("User left whitelisted segment. Should return event", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        left: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
        ],
      },
      account_segments: {}
    };

    const event = "LEFT_USER_SEGMENT";
    const synchronized_segment = "segment_1";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Left User Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      }
    ]);
  });

  it("User leaves 'ALL' whitelisted segment. Should return multiple events", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        left: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
          {
            id: "segment_2",
            name: "Segment2",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          }
        ],
      },
      account_segments: {}
    };

    const event = "LEFT_USER_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(2);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Left User Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      },
      {
        "event": {
          "event": "Left User Segment"
        },
        "segment": {
          "id": "segment_2",
          "name": "Segment2",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      }
    ]);
  });

  it("User leaves 'ALL' segment. Should return event", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        left: [
          {
            id: "user_segment_1",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
        ],
      },
      account_segments: {}
    };

    const event = "LEFT_USER_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Left User Segment"
        },
        "segment": {
          "id": "user_segment_1",
          "name": "Smugglers",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "user_segment"
        }
      }
    ]);
  });

  it("User leaves non whitelisted segment. Should not return event", () => {
    const changes = {
      is_new: false,
      account: {},
      user: { id: "1" },
      segments: {
        left: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "user_segment",
          },
        ],
      },
      account_segments: {}
    };

    const event = "LEFT_USER_SEGMENT";
    const synchronized_segment = "random";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(0);
    expect(segmentMatches).toEqual([]);
  });
});
