const _ = require("lodash");
require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const userCreatedPayload = {
  "user": {
    "email": "bob@hull.com",
    "segment_ids": [
      "user_segment_1"
    ]
  },
  "changes": {
    "is_new": true,
    "account": {},
    "segments": [],
    "account_segments": [],
    "user": {},
  },
  "account": {},
  "segments": [
    {
      "id": "user_segment_1",
      "name": "UserSegment1"
    }
  ],
  "events": [],
  "account_segments": [],
  "message_id": "message_1",
};

describe('Trigger - user_created', () => {
  zapier.tools.env.inject();

  it('User created - Valid single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userCreatedPayload);

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
      App.triggers['user_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userCreatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('User created not in whitelisted segment - Should filter single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userCreatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["random"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Account created, but erroneously sent to User Created trigger - Should filter single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userCreatedPayload);
    _.set(message1, "account", { "somekey": "somevalue" });
    _.set(message1, "user", {});


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
      App.triggers['user_created'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('User created - 5 messages sent to Zapier. 3 are filtered out', async () => {
    const message1 = _.cloneDeep(userCreatedPayload);
    const message2 = _.cloneDeep(userCreatedPayload);
    const message3 = _.cloneDeep(userCreatedPayload);
    const message4 = _.cloneDeep(userCreatedPayload);
    const message5 = _.cloneDeep(userCreatedPayload);

    _.set(message2, "message_id", "message_2");
    _.set(message2, "changes.is_new", false);

    _.set(message3, "message_id", "message_3");
    _.set(message3, "changes.is_new", false);

    _.set(message4, "message_id", "message_4");
    _.set(message4, "changes", {});

    _.set(message5, "message_id", "message_5");
    _.set(message5, "changes.is_new", true);

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
        message1,
        message2,
        message3,
        message4,
        message5
      ]
    };

    const results = await appTester(
      App.triggers['user_created'].operation.perform,
      bundle
    );

    results.should.be.an.Array();
    results.should.have.lengthOf(2);
    _.forEach(results, (result) => {
      _.forEach(_.keys(userCreatedPayload), (key) => {
        result.should.have.property(key);
      });
    });

    should.equal(results[0].message_id, "message_1");
    should.equal(results[1].message_id, "message_5");
  });
});
