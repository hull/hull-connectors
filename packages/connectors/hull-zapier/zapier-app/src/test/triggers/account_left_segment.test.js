const _ = require("lodash");
require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const accountLeftSegmentPayload = {
  "user": {
    "segment_ids": [
      "account_segment_1"
    ]
  },
  "changes": {
    "account_segments": {
      "left": [
        {
          "id": "account_segment_1",
          "name": "AccountSegment1"
        }
      ]
    }
  },
  "account": {},
  "segments": [
    {
      "id": "account_segment_2",
      "name": "AccountSegment2"
    }
  ],
  "events": [],
  "account_segments": [],
  "message_id": "message_1",
};

describe('Trigger - account_left', () => {
  zapier.tools.env.inject();

  it('Account left defined segment and is not in any other segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountLeftSegmentPayload);
    _.set(message1, "account_segments", []);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['account_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(accountLeftSegmentPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('Account did not leave a segment. All segments left pass through - do not send message to Zapier', async () => {
    const message1 = _.cloneDeep(accountLeftSegmentPayload);
    _.set(message1, "changes.account_segments", {});

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["all_segments"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['account_entered_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Account left a segment. All segments left pass through - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountLeftSegmentPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["all_segments"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['account_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(accountLeftSegmentPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('Account left defined segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountLeftSegmentPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['account_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(accountLeftSegmentPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('Account left defined segment - 5 messages sent to Zapier. 3 are filtered out', async () => {
    const message1 = _.cloneDeep(accountLeftSegmentPayload);
    const message2 = _.cloneDeep(accountLeftSegmentPayload);
    const message3 = _.cloneDeep(accountLeftSegmentPayload);
    const message4 = _.cloneDeep(accountLeftSegmentPayload);
    const message5 = _.cloneDeep(accountLeftSegmentPayload);

    _.set(message2, "message_id", "message_2");
    _.set(message2, "changes.account_segments.left", [
      {
        "id": "account_segment_2",
        "name": "AccountSegment2"
      }
    ]);

    _.set(message3, "message_id", "message_3");
    _.set(message3, "changes.account_s.left", [
      {
        "id": "account_segment_3",
        "name": "AccountSegment3"
      }
    ]);

    _.set(message4, "message_id", "message_4");
    _.set(message4, "changes", {});

    _.set(message5, "message_id", "message_5");
    _.set(message5, "changes.account_segments.left", [
      {}
    ]);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1", "account_segment_3"]
      },

      cleanedRequest: [
        message1,
        message2,
        message3,
        message4,
        message5
      ]
    };

    const results = await appTester(
      App.triggers['account_left_segment'].operation.perform,
      bundle
    );

    results.should.be.an.Array();
    results.should.have.lengthOf(2);
    _.forEach(results, (result) => {
      _.forEach(_.keys(accountLeftSegmentPayload), (key) => {
        result.should.have.property(key);
      });
    });

    should.equal(results[0].message_id, "message_1");
    should.equal(results[1].message_id, "message_3");
  });

  it('Account left a segment, but no defined zapier segments - should not activate trigger', async () => {
    const message1 = _.cloneDeep(accountLeftSegmentPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: []
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['account_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });
});
