const _ = require("lodash");
require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const userLeftSegmentPayload = {
  "user": {
    "segment_ids": [
      "user_segment_1"
    ]
  },
  "changes": {
    "segments": {
      "left": [
        {
          "id": "user_segment_1",
          "name": "UserSegment1"
        }
      ]
    }
  },
  "account": {},
  "segments": [
    {
      "id": "user_segment_2",
      "name": "UserSegment2"
    }
  ],
  "events": [],
  "account_segments": [],
  "message_id": "message_1",
};

describe('Trigger - user_left', () => {
  zapier.tools.env.inject();

  it('User left defined segment and is not in any other segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userLeftSegmentPayload);
    _.set(message1, "segments", []);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userLeftSegmentPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('User left a segment. All segments left pass through - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userLeftSegmentPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["all_segments"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['user_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userLeftSegmentPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('User left defined segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userLeftSegmentPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['user_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userLeftSegmentPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('User left defined segment - 5 messages sent to Zapier. 3 are filtered out', async () => {
    const message1 = _.cloneDeep(userLeftSegmentPayload);
    const message2 = _.cloneDeep(userLeftSegmentPayload);
    const message3 = _.cloneDeep(userLeftSegmentPayload);
    const message4 = _.cloneDeep(userLeftSegmentPayload);
    const message5 = _.cloneDeep(userLeftSegmentPayload);

    _.set(message2, "message_id", "message_2");
    _.set(message2, "changes.segments.left", [
      {
        "id": "user_segment_2",
        "name": "UserSegment2"
      }
    ]);

    _.set(message3, "message_id", "message_3");
    _.set(message3, "changes.segments.left", [
      {
        "id": "user_segment_3",
        "name": "UserSegment3"
      }
    ]);

    _.set(message4, "message_id", "message_4");
    _.set(message4, "changes", {});

    _.set(message5, "message_id", "message_5");
    _.set(message5, "changes.segments", {});

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["user_segment_1", "user_segment_3"]
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
      App.triggers['user_left_segment'].operation.perform,
      bundle
    );

    results.should.be.an.Array();
    results.should.have.lengthOf(2);
    _.forEach(results, (result) => {
      _.forEach(_.keys(userLeftSegmentPayload), (key) => {
        result.should.have.property(key);
      });
    });

    should.equal(results[0].message_id, "message_1");
    should.equal(results[1].message_id, "message_3");
  });

  it('User left a segment, but no defined zapier segments - should not activate trigger', async () => {
    const message1 = _.cloneDeep(userLeftSegmentPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: []
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['user_left_segment'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });
});
