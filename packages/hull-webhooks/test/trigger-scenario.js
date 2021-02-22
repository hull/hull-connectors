const _ = require("lodash");
const expect = require("expect");

function createSimpleTriggerScenario({trigger, negative = false, settingsOverwrite = {}}) {
  const scenario = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-entity"));

  let synchronized_events = [];
  let synchronized_segments_enter = [];
  let synchronized_segments_leave = [];
  let synchronized_attributes = [];
  let synchronized_segments_whitelist = [];
  let code;
  let message;
  if (trigger.includes("user")) {
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

    case "is_new_user": {
      synchronized_events = ['CREATED'];
      synchronized_segments_whitelist = ['user_segment_1'];

      private_settings = {
        ...private_settings,
        synchronized_events,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.is_new", true);

      break;
    }

    case "user_events": {

      if (!negative) {
        synchronized_events = ['Email Opened'];
        synchronized_segments_whitelist = ['user_segment_1'];
      } else {
        synchronized_events = ['Email Sent'];
        synchronized_segments_whitelist = ['user_segment_1'];
      }

      private_settings = {
        ...private_settings,
        synchronized_events,
        synchronized_segments_whitelist
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

    case "user_events_all": {

      synchronized_events = ['all_events'];
      synchronized_segments_whitelist = ['all_segments'];

      private_settings = {
        ...private_settings,
        synchronized_events,
        synchronized_segments_whitelist
      };

      if (negative) {
        _.set(message, "events", []);
      } else {
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
      }
      break;
    }

    case "user_segments_entered": {

      if (!negative) {
        synchronized_segments_enter = ['user_segment_1'];
        synchronized_segments_whitelist = ['user_segment_1'];
      } else {
        synchronized_segments_enter = ['user_segment_2'];
        synchronized_segments_whitelist = ['user_segment_1'];
      }

      private_settings = {
        ...private_settings,
        synchronized_segments_enter,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.segments.entered", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
      break;
    }

    case "user_segments_left": {

      if (!negative) {
        synchronized_segments_leave = [ 'user_segment_2'];
        synchronized_segments_whitelist =[ 'user_segment_1' ];
      } else {
        synchronized_segments_leave = [ 'user_segment_3'];
        synchronized_segments_whitelist =[ 'user_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_segments_leave,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.segments.left", [{ "id": "user_segment_2", "name": "UserSegment2" }]);
      break;
    }

    case "user_attribute_updated": {

      if (!negative) {
        synchronized_attributes = [ 'description'];
        synchronized_segments_whitelist =[ 'user_segment_1' ];
      } else {
        synchronized_attributes = [ 'department'];
        synchronized_segments_whitelist =[ 'user_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_attributes,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.user", { "description": ["1", "2"] });
      break;
    }

    case "user_synchronized_segment": {
      private_settings = {
        ...private_settings,
        synchronized_segments_whitelist: [ 'user_segment_1' ]
      };
      _.set(message, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
      break;
    }

    case "is_new_account": {
      synchronized_events = ['CREATED'];
      synchronized_segments_whitelist = ['account_segment_1'];

      private_settings = {
        ...private_settings,
        synchronized_events,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.is_new", true);

      break;
    }

    case "account_segments_entered": {

      if (!negative) {
        synchronized_segments_enter = [ 'account_segment_1'];
        synchronized_segments_whitelist =[ 'account_segment_1' ];
      } else {
        synchronized_segments_enter = [ 'account_segment_2'];
        synchronized_segments_whitelist =[ 'account_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_segments_enter,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.account_segments.entered", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);
      break;
    }

    case "account_segments_left": {

      if (!negative) {
        synchronized_segments_leave = [ 'account_segment_2'];
        synchronized_segments_whitelist =[ 'account_segment_1' ];
      } else {
        synchronized_segments_leave = [ 'account_segment_1'];
        synchronized_segments_whitelist =[ 'account_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_segments_leave,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.account_segments.left", [{ "id": "account_segment_2", "name": "AccountSegment2" }]);
      break;
    }

    case "account_attribute_updated": {

      if (!negative) {
        synchronized_attributes = [ 'description'];
        synchronized_segments_whitelist =[ 'account_segment_1' ];
      } else {
        synchronized_attributes = [ 'industry'];
        synchronized_segments_whitelist =[ 'account_segment_1' ];
      }

      private_settings = {
        ...private_settings,
        synchronized_attributes,
        synchronized_segments_whitelist
      };
      _.set(message, "changes.account", { "description": ["1", "2"] });
      break;
    }

    case "account_synchronized_segment": {
      private_settings = {
        ...private_settings,
        synchronized_segments_whitelist: [ 'account_segment_1' ]
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
          "url": "http://example.com/mock",
          "status": 200
        })
      ]),
      expect.arrayContaining([
        expect.stringMatching("outgoing\.(account)|(user)\.success"),
        expect.objectContaining({
          "url": "http://example.com/mock",
          "headers": [{ "key": "Accept", "value": "application/json" }],
          "payload": {
            "changes": this.getChanges(),
            "account": this.getAccount(),
            "user": this.getUser(),
            "account_segments": this.getAccountSegments(),
            "segments": this.getSegments(),
            "user_segments": this.getSegments(),
            "events": expect.whatever(),
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
