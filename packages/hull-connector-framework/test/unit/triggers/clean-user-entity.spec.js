/* @flow */
const _ = require("lodash");

const { getCleanedMessage } = require("../../../src/purplefusion/triggers/trigger-utils");

describe("Outgoing User Filtering Tests", () => {

  it("User Entered Valid Segment. Should filter out non whitelisted segments.", () => {
    const inputData = { "entered_user_segments": ["user_segment_1", "user_segment_2", "user_segment_3"] };
    const message = {
      "changes": { "segments": { "entered": [{ "id": "user_segment_1" }, { "id": "user_segment_2" }] } },
      "account": {},
      "user": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "segments": { "entered": [{ "id": "user_segment_1" }, { "id": "user_segment_2" }] } },
      "account": {},
      "user": { "id": "1" },
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("User did not enter a segment. Should return empty segments entered list.", () => {
    const inputData = { "entered_user_segments": ["user_segment_1", "user_segment_2", "user_segment_3"] };
    const message = {
      "changes": {},
      "account": {},
      "user": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "segments": { "entered": [] } },
      "account": {},
      "user": { "id": "1" },
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("User Left Valid Segment. Should filter out non whitelisted segments.", () => {
    const inputData = { "left_user_segments": ["user_segment_1", "user_segment_2", "user_segment_3"] };
    const message = {
      "changes": { "segments": { "left": [{ "id": "user_segment_1" }, { "id": "user_segment_2" }] } },
      "account": {},
      "user": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "segments": { "left": [{ "id": "user_segment_1" }, { "id": "user_segment_2" }] } },
      "account": {},
      "user": { "id": "1" },
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("User Attribute Changed. Should filter out non whitelisted attributes.", () => {
    const inputData = {
      user_attribute_updated: [ "attr1", "attr2" ],
      user_segments: [ "all_segments" ],
      account_segments: [ "all_segments" ]
    };
    const message = {
      "changes": {
        "user": {
          "attr1": ["value_1", "value_2"],
          "attr2": ["value_3", "value_4"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {},
      "user": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": {
        "user": {
          "attr1": ["value_1", "value_2"],
          "attr2": ["value_3", "value_4"],
        }
      },
      "account": {},
      "user": { "id": "1" },
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("User Event Created. Should filter out non whitelisted attributes.", () => {
    const inputData = {
      "account_segments": [ 'all_segments' ],
      "user_segments": [ 'user_segment_1' ],
      "user_events": [ 'Email Opened', 'Email Sent' ]
    };
    const message = {
      "changes": {
        "user": {
          "attr1": ["value_1", "value_2"],
          "attr2": ["value_3", "value_4"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {},
      "user": {
        "id": "1"
      },
      "events": [
        { "event": "Email Opened", "id": "event_1" },
        { "event": "Email Dropped", "id": "event_2" },
        { "event": "Email Sent", "id": "event_3" }],
      "account_segments": [],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(message, inputData);
    expect(cleanedMessage).toEqual({
      "account": {},
      "user": { "id": "1" },
      "account_segments": [],
      "events": [
        { "event": "Email Opened", "id": "event_1" },
        { "event": "Email Sent", "id": "event_3" }
      ],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("User Created. Should filter out non whitelisted attributes.", () => {
    const inputData = {
      is_new_user: true
    };
    const message = {
      "changes": {
        "is_new": true,
        "user": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "0"
      },
      "user": {
        "id": "1"
      },
      "events": [
        { "event": "Email Opened", "id": "event_1" },
        { "event": "Email Dropped", "id": "event_2" },
        { "event": "Email Sent", "id": "event_3" }],
      "account_segments": [{"id": "account_segment_1"}],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "is_new": true },
      "account": { "id": "0" },
      "user": { "id": "1" },
      "account_segments": [{"id": "account_segment_1"}],
      "segments": [{ "id": "user_segment_1" }],
      "message_id": "message_1"
    });
  });
});
