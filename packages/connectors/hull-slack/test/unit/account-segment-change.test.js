const { getSegmentChanges } = require("../../server/utils/get-segment-changes");

describe("Slack Account Entered Segment Tests", () => {

  it("Account enters whitelisted segment. Should return event", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        entered: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
        ],
      },
      segments: {},
    };

    const event = "ENTERED_ACCOUNT_SEGMENT";
    const synchronized_segment = "segment_1";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Entered Account Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      }
    ]);
  });

  it("Account enters 'ALL' whitelisted segment. Should return multiple events", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        entered: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
          {
            id: "segment_2",
            name: "Segment2",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          }
        ],
      },
      segments: {},
    };

    const event = "ENTERED_ACCOUNT_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(2);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Entered Account Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      },
      {
        "event": {
          "event": "Entered Account Segment"
        },
        "segment": {
          "id": "segment_2",
          "name": "Segment2",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      }
    ]);
  });

  it("Account enters 'ALL' segment. Should return event", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        entered: [
          {
            id: "account_segment_1",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
        ],
      },
      segments: {},
    };

    const event = "ENTERED_ACCOUNT_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Entered Account Segment"
        },
        "segment": {
          "id": "account_segment_1",
          "name": "Smugglers",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      }
    ]);
  });

  it("Account enters non whitelisted segment. Should not return event", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        entered: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
        ],
      },
      segments: {},
    };

    const event = "ENTERED_ACCOUNT_SEGMENT";
    const synchronized_segment = "random";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(0);
    expect(segmentMatches).toEqual([]);
  });
});

describe("Slack Account Left Segment Tests", () => {

  it("Account left whitelisted segment. Should return event", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        left: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
        ],
      },
      segments: {},
    };

    const event = "LEFT_ACCOUNT_SEGMENT";
    const synchronized_segment = "segment_1";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Left Account Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      }
    ]);
  });

  it("Account leaves 'ALL' whitelisted segment. Should return multiple events", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        left: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
          {
            id: "segment_2",
            name: "Segment2",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          }
        ],
      },
      segments: {},
    };

    const event = "LEFT_ACCOUNT_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(2);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Left Account Segment"
        },
        "segment": {
          "id": "segment_1",
          "name": "Segment1",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      },
      {
        "event": {
          "event": "Left Account Segment"
        },
        "segment": {
          "id": "segment_2",
          "name": "Segment2",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      }
    ]);
  });

  it("Account leaves 'ALL' segment. Should return event", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        left: [
          {
            id: "account_segment_1",
            name: "Smugglers",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
        ],
      },
      segments: {},
    };

    const event = "LEFT_ACCOUNT_SEGMENT";
    const synchronized_segment = "ALL";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(1);
    expect(segmentMatches).toEqual([
      {
        "event": {
          "event": "Left Account Segment"
        },
        "segment": {
          "id": "account_segment_1",
          "name": "Smugglers",
          "updated_at": "2019-04-24T17:54:46Z",
          "type": "account_segment",
        }
      }
    ]);
  });

  it("Account leaves non whitelisted segment. Should not return event", () => {
    const changes = {
      is_new: false,
      user: {},
      account: { id: "1" },
      account_segments: {
        left: [
          {
            id: "segment_1",
            name: "Segment1",
            updated_at: "2019-04-24T17:54:46Z",
            type: "account_segment",
          },
        ],
      },
      segments: {},
    };

    const event = "LEFT_ACCOUNT_SEGMENT";
    const synchronized_segment = "random";
    const segmentMatches = getSegmentChanges({ event, synchronized_segment, changes });

    expect(segmentMatches.length).toBe(0);
    expect(segmentMatches).toEqual([]);
  });
});
