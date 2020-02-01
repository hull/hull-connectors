const _ = require("lodash");
require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const accountAttributeUpdatedPayload = {
  "user": {},
  "changes": {
    "is_new": false,
    "user": {},
    "segments": [],
    "account_segments": [],
    "account": {
      "domain": [
        "bob.com",
        "bob-inc.com"
      ]
    },
  },
  "account": {
    "segment_ids": [
      "account_segment_1"
    ]
  },
  "segments": [],
  "events": [],
  "account_segments": [
    {
      "id": "account_segment_1",
      "name": "AccountSegment1"
    },
  ],
  "message_id": "message_1",
};

describe('Trigger - account_attribute_updated', () => {
  zapier.tools.env.inject();

  it('Account attribute updated and account belongs to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountAttributeUpdatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1"],
        account_attributes: ["domain", "pipedrive/domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['account_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(accountAttributeUpdatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('No account attribute changes, but there are user changes. Account belong to whitelisted segments - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountAttributeUpdatedPayload);

  _.set(message1, "changes.account", {});
  _.set(message1, "changes.user",
      {
        "random_attribute": [
          "old_1",
          "new_1"
        ]
      }
    );

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1"],
        account_attributes: ["domain", "pipedrive/domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['account_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Account attribute updated and account does not belong to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountAttributeUpdatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["random_segment_id"],
        account_attributes: ["domain", "pipedrive/domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['account_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Account attribute that is not whitelisted is updated and account belongs to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(accountAttributeUpdatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1"],
        account_attributes: ["randomattr1", "pipedrive/randomattr2"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['account_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Account attribute updated and account belongs to whitelisted segment - 3 messages sent to Zapier, 2 are filtered out', async () => {
    const message1 = _.cloneDeep(accountAttributeUpdatedPayload);
    const message2 = _.cloneDeep(accountAttributeUpdatedPayload);
    const message3 = _.cloneDeep(accountAttributeUpdatedPayload);

    _.set(message2, "message_id", "message_2");
    _.set(message2, "changes.account",
      {
        "random_attribute": [
          "old_1",
          "new_1"
        ]
      }
    );

    _.set(message3, "message_id", "message_3");
    _.set(message3, "changes.account", {});

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        account_segments: ["account_segment_1"],
        account_attributes: ["domain", "pipedrive/domain"]
      },

      cleanedRequest: [
        message1,
        message2,
        message3
      ]
    };

    const results = await appTester(
      App.triggers['account_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(accountAttributeUpdatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });
});
