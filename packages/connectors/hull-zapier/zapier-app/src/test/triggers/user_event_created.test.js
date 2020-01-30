const _ = require("lodash");
require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const userEventCreatedPayload = {
  "user": {
    "id": "user_id_1",
    "segment_ids": [
      "user_segment_1"
    ]
  },
  "changes": {
    "is_new": false,
    "user": {},
    "account": {},
    "account_segments": {},
    "segments": {}
  },
  "account": {},
  "segments": [
    {
      "id": "user_segment_1",
      "name": "UserSegment1"
    },
    {
      "id": "user_segment_2",
      "name": "UserSegment2"
    }
  ],
  "events": [
    {
      "event": "Email Opened",
      "event_id": "email_opened_1",
      "user_id": "user_id_1",
      "properties": {
        "emailCampaignId": "837382",
        "created": "1563746708853"
      },
      "event_source": "hubspot",
      "context": {}
    }
  ],
  "account_segments": [],
  "message_id": "message_1",
};

describe('Trigger - user_event_created', () => {
  zapier.tools.env.inject();

  it('No events to send', async () => {
    const message1 = _.cloneDeep(userEventCreatedPayload);
    message1.events = [];

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1"],
        account_segments: ["all_segments"],
        user_events: ["Email Sent", "Email Opened"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_event_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Whitelisted user event created and user belongs to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userEventCreatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1"],
        account_segments: ["all_segments"],
        user_events: ["Email Sent", "Email Opened"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_event_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userEventCreatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('Non-Whitelisted user event created and user belongs to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userEventCreatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1"],
        account_segments: ["all_segments"],
        user_events: ["Email Sent", "Email Dropped"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['user_event_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Whitelisted user event created and user does not belong to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userEventCreatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["random_segment_id_1"],
        account_segments: ["all_segments"],
        user_events: ["Email Sent", "Email Opened"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['user_event_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('User Events - 3 messages sent to Zapier, 1 filtered out', async () => {
    const message1 = _.cloneDeep(userEventCreatedPayload);
    const message2 = _.cloneDeep(userEventCreatedPayload);
    const message3 = _.cloneDeep(userEventCreatedPayload);

    _.set(message2, "message_id", "message_2");
    _.set(message2, "events", [
      {
        event: "Email Dropped",
        event_id: "email_opened_3"
      }
    ]);
    _.set(message3, "message_id", "message_3");

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1"],
        account_segments: ["all_segments"],
        user_events: ["Email Sent", "Email Opened"]
      },

      cleanedRequest: [
        message1,
        message2,
        message3
      ]
    };

    const results = await appTester(
      App.triggers['user_event_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(2);
    _.forEach(_.keys(userEventCreatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
    should.equal(results[1].message_id, "message_3");
  });
});
