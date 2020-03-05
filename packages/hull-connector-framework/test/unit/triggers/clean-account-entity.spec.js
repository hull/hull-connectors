/* @flow */

import TRIGGERS  from "../../../src/purplefusion/triggers/triggers";

const _ = require("lodash");

const { getCleanedMessage } = require("../../../src/purplefusion/triggers/trigger-utils");

describe("Outgoing Account Filtering Tests", () => {

  it("Account Entered Valid Segment. Should filter out non whitelisted segments.", () => {
    const inputData = { "entered_account_segments": ["account_segment_1", "account_segment_2", "account_segment_3"] };
    const message = {
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] } },
      "user": {},
      "account": {
        "id": "1"
      },
      "events": [],
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(TRIGGERS, message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] } },
      "account": { "id": "1" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("Account did not enter a segment. Should return empty segments entered list.", () => {
    const inputData = { "entered_account_segments": ["account_segment_1", "account_segment_2", "account_segment_3"] };
    const message = {
      "changes": {},
      "user": {},
      "account": {
        "id": "1"
      },
      "events": [],
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(TRIGGERS, message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "account_segments": { "entered": [] } },
      "account": { "id": "1" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("Account Left Valid Segment. Should filter out non whitelisted segments.", () => {
    const inputData = { "left_account_segments": ["account_segment_1", "account_segment_2", "account_segment_3"] };
    const message = {
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] } },
      "user": {},
      "account": {
        "id": "1"
      },
      "events": [],
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(TRIGGERS, message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] } },
      "account": { "id": "1" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("Account Attribute Changed. Should filter out non whitelisted attributes.", () => {
    const inputData = {
      account_attribute_updated: [ "attr1", "attr2" ],
      account_segments: [ "all_segments" ]
    };
    const message = {
      "changes": {
        "account": {
          "attr1": ["value_1", "value_2"],
          "attr2": ["value_3", "value_4"],
          "bl_attr": ["", "1"]
        }
      },
      "user": {},
      "account": {
        "id": "1"
      },
      "events": [],
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(TRIGGERS, message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": {
        "account": {
          "attr1": ["value_1", "value_2"],
          "attr2": ["value_3", "value_4"],
        }
      },
      "account": { "id": "1" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
  });

  it("Account Created. Should filter out non whitelisted attributes.", () => {
    const inputData = {
      is_new_account: true
    };
    const message = {
      "changes": {
        "is_new": true,
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "0"
      },
      "user": {},
      "events": [
        { "event": "Email Opened", "id": "event_1" },
        { "event": "Email Dropped", "id": "event_2" },
        { "event": "Email Sent", "id": "event_3" }],
      "account_segments": [{"id": "account_segment_1"}],
      "segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const cleanedMessage = getCleanedMessage(TRIGGERS, message, inputData);
    expect(cleanedMessage).toEqual({
      "changes": { "is_new": true },
      "account": { "id": "0" },
      "account_segments": [{"id": "account_segment_1"}],
      "message_id": "message_1"
    });
  });
});
