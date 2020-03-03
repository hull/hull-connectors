const _ = require("lodash");
const expect = require("expect");

function createSimpleTriggerScenario({trigger, negative = false, settingsOverwrite = {}}) {
  const scenario = _.cloneDeep(require("./integration/fixtures/notifier-payloads/update-single-entity"));

  let synchronized_user_events = [];
  let synchronized_user_segments_enter = [];
  let synchronized_user_segments_leave = [];
  let synchronized_user_attributes = [];
  let synchronized_account_segments_enter = [];
  let synchronized_account_segments_leave = [];
  let synchronized_account_attributes = [];
  let synchronized_user_segments = [];
  let synchronized_account_segments = [];
  let code;
  let message;
  if (_.startsWith(trigger, "user")) {
    code = "{'email': user.email}";
    message = scenario.user_message;
    _.unset(scenario, "account_message");
  } else {
    code = "{'domain': account.domain}";
    message = scenario.account_message;
    _.unset(scenario, "user_message");
  }

  let private_settings = {
    ...scenario.connector.private_settings,
    code
  };

  switch (trigger) {
    case "user_event": {

      if (!negative) {
        synchronized_user_events = ['Email Opened'];
        synchronized_user_segments = ['user_segment_1'];
      } else {
        synchronized_user_events = ['Email Sent'];
        synchronized_user_segments = ['user_segment_1'];
      }

      private_settings = {
        ...private_settings,
        synchronized_user_events,
        synchronized_user_segments
      };
      _.set(message, "events", [
        {
          "event": "Email Opened",
          "event_id": "email_opened_1",
          "user_id": "5bd329d5e2bcf3eeaf000099",
          "properties": {
            "emailCampaignId": "837382",
            "created": "1563746708853"
          }
        }
      ]);
      break;
    }

    case "user_entered_segment": {

      if (!negative) {
        synchronized_user_segments_enter = ['user_segment_1'];
        synchronized_user_segments = ['user_segment_1'];
      } else {
        synchronized_user_segments_enter = ['user_segment_2'];
        synchronized_user_segments = ['user_segment_1'];
      }

      private_settings = {
        ...private_settings,
        synchronized_user_segments_enter,
        synchronized_user_segments
      };
      _.set(message, "changes.segments.entered", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
      break;
    }

    case "user_left_segment": {

      if (!negative) {
        synchronized_user_segments_leave = [ 'user_segment_2'];
        synchronized_user_segments =[ 'user_segment_1' ];
      } else {
        synchronized_user_segments_leave = [ 'user_segment_3'];
        synchronized_user_segments =[ 'user_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_user_segments_leave,
        synchronized_user_segments
      };
      _.set(message, "changes.segments.left", [{ "id": "user_segment_2", "name": "UserSegment2" }]);
      break;
    }

    case "user_attribute_updated": {

      if (!negative) {
        synchronized_user_attributes = [ 'description'];
        synchronized_user_segments =[ 'user_segment_1' ];
      } else {
        synchronized_user_attributes = [ 'department'];
        synchronized_user_segments =[ 'user_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_user_attributes,
        synchronized_user_segments
      };
      _.set(message, "changes.user", { "description": ["1", "2"] });
      break;
    }

    case "user_synchronized_segment": {
      private_settings = {
        ...private_settings,
        synchronized_user_segments: [ 'user_segment_1' ]
      };
      _.set(message, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
      break;
    }

    case "account_entered_segment": {

      if (!negative) {
        synchronized_account_segments_enter = [ 'account_segment_1'];
        synchronized_account_segments =[ 'account_segment_1' ];
      } else {
        synchronized_account_segments_enter = [ 'account_segment_2'];
        synchronized_account_segments =[ 'account_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_account_segments_enter,
        synchronized_account_segments
      };
      _.set(message, "changes.account_segments.entered", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);
      break;
    }

    case "account_left_segment": {

      if (!negative) {
        synchronized_account_segments_leave = [ 'account_segment_2'];
        synchronized_account_segments =[ 'account_segment_1' ];
      } else {
        synchronized_account_segments_leave = [ 'account_segment_1'];
        synchronized_account_segments =[ 'account_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_account_segments_leave,
        synchronized_account_segments
      };
      _.set(message, "changes.account_segments.left", [{ "id": "account_segment_2", "name": "AccountSegment2" }]);
      break;
    }

    case "account_attribute_updated": {

      if (!negative) {
        synchronized_account_attributes = [ 'description'];
        synchronized_account_segments =[ 'account_segment_1' ];
      } else {
        synchronized_account_attributes = [ 'industry'];
        synchronized_account_segments =[ 'account_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_account_attributes,
        synchronized_account_segments
      };
      _.set(message, "changes.account", { "description": ["1", "2"] });
      break;
    }

    case "account_synchronized_segment": {
      private_settings = {
        ...private_settings,
        synchronized_account_segments: [ 'account_segment_1' ]
      };
      _.set(message, "account_segments", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);
      break;
    }
  }

  scenario.connector.private_settings = {
    ...private_settings,
    ...settingsOverwrite
  };

  _.set(scenario, "messages", [message]);
  _.set(scenario, "negative", negative);
  return new TriggerScenario(scenario);
}

class TriggerScenario {

  scenarioDefinition: Object;
  negative: boolean;
  message: Object;
  user: Object;
  account: Object;
  changes: Object;
  account_segments: Array<Object>;
  segments: Array<Object>;
  segment_ids: Array<string>;

  constructor(scenarioDefinition) {
    this.scenarioDefinition = scenarioDefinition;
    this.message = scenarioDefinition.user_message || scenarioDefinition.account_message ;
    this.negative = scenarioDefinition.negative || false;
    this.user = this.message.user;
    this.account = this.message.account;
    this.changes = this.message.changes;
    this.account_segments = this.message.account_segments;
    this.segments = this.message.segments;
    this.events = this.message.events;
    this.segment_ids = this.message.segment_ids;
  }

  getScenarioDefinition() {
    return this.scenarioDefinition;
  }

  getExpectedResponse() {
    return { flow_control: { type: "next" } };
  }

  getExpectedLogs() {
    if (this.negative) {
      return [];
    }
    return [
      expect.arrayContaining([
        expect.objectContaining({
          "method": "POST",
          "url": "http://fake-url.io/mock",
          "status": 200
        })
      ]),
      expect.arrayContaining([
        expect.stringMatching("outgoing\.(account)|(user)\.success"),
        expect.objectContaining({
          "url": "http://fake-url.io/mock",
          "headers": [{ "key": "Accept", "value": "application/json" }],
          "payload": {
            "variables": {},
            "changes": this.getChanges(),
            "account": this.getAccount(),
            "user": this.getUser(),
            "account_segments": this.getAccountSegments(),
            "segments": this.getSegments(),
            "user_segments": this.getSegments(),
            "events": this.getEvents(),
            "user_segment_ids": this.getSegmentIds(),
            "segment_ids": this.getSegmentIds(),
            "message_id": "message_1",
          },
          "message": {
            "status": 200
          }
        })
      ])
    ]
  }

  getExpectedFirehoseEvents() {
    return [];
  }

  getExpectedPlatformApiCalls() {
    return [];
  }

  getExpectedMetrics() {
    const metrics = [["increment","connector.request",1]];
    if (!this.negative) {
      metrics.push(["increment","ship.service_api.call",1]);
      metrics.push(["value","connector.service_api.response_time",expect.whatever()]);
    }
    return metrics;
  }

  getUser() {
    return this.user;
  }

  getAccount() {
    return this.account;
  }

  getChanges() {
    return this.changes;
  }

  getSegments() {
    return this.segments;
  }

  getAccountSegments() {
    return this.account_segments;
  }

  getEvents() {
    return this.events;
  }

  getSegmentIds() {
    return this.segment_ids;
  }

}

export {createSimpleTriggerScenario, TriggerScenario};
