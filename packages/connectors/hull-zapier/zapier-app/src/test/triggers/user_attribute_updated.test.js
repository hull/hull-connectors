const _ = require("lodash");
require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const userAttributeUpdatedPayload = {
  "user": {
    "segment_ids": [
      "user_segment_1"
    ]
  },
  "changes": {
    "is_new": false,
    "account": {},
    "segments": [],
    "account_segments": [],
    "user": {
      "name": [
        "Bob",
        "Bobby"
      ],
      "pipedrive/department": [
        "marketing",
        "sales"
      ]
    },
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
  "events": [],
  "account_segments": [],
  "message_id": "message_1",
};

describe('Trigger - user_attribute_updated', () => {
  zapier.tools.env.inject();

  it('User attribute updated and user belongs to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);

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
        user_attributes: ["name", "pipedrive/department"]
      },

      cleanedRequest: [
        message1
      ]
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userAttributeUpdatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('User attribute updated and user does not belong to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        user_segments: ["random_segment_id"],
        account_segments: ["all_segments"],
        user_attributes: ["name", "pipedrive/department"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('User attribute that is not whitelisted is updated and user belongs to whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);

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
        user_attributes: ["first_name", "pipedrive/email"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('User attribute updated and user belongs to whitelisted segment - 3 messages sent to Zapier, 2 are filtered out', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);
    const message2 = _.cloneDeep(userAttributeUpdatedPayload);
    const message3 = _.cloneDeep(userAttributeUpdatedPayload);

    _.set(message2, "message_id", "message_2");
    _.set(message2, "changes.user",
      {
        "random_attribute": [
          "old_1",
          "new_1"
        ]
      }
    );

    _.set(message3, "message_id", "message_3");
    _.set(message3, "changes.user", {});

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
        user_attributes: ["name", "pipedrive/department"]
      },

      cleanedRequest: [
        message1,
        message2,
        message3
      ]
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userAttributeUpdatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('Both account and user pass attribute and segment whitelists - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);
    _.set(message1, "changes.user", { "name": ["old_1", "new_1"]});
    _.set(message1, "changes.account", { "domain": ["old_domain_1", "new_domain_1"]});
    _.set(message1, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
    _.set(message1, "account_segments", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);

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
        user_attributes: ["name", "pipedrive/department"],
        account_attributes: ["domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    _.forEach(_.keys(userAttributeUpdatedPayload), (key) => {
      results[0].should.have.property(key);
    });

    should.equal(results[0].message_id, "message_1");
  });

  it('User passes attribute and segments whitelists. Account is not in whitelisted segment - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);
    _.set(message1, "changes.user", { "name": ["old_1", "new_1"]});
    _.set(message1, "changes.account", { "domain": ["old_domain_1", "new_domain_1"]});
    _.set(message1, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
    _.set(message1, "account_segments", [{ "id": "random_segment_id_1", "name": "AccountSegment1" }]);

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
        account_segments: ["account_segment_1"],
        user_attributes: ["name", "pipedrive/department"],
        account_attributes: ["domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('User passes segments whitelist. Account is in whitelisted segment and passes attribute changes - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);
    _.set(message1, "changes.user", {});
    _.set(message1, "changes.account", { "domain": ["old_domain_1", "new_domain_1"]});
    _.set(message1, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
    _.set(message1, "account_segments", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);

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
        account_segments: ["account_segment_1"],
        account_attributes: ["domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);
    should.equal(results[0].message_id, "message_1");
  });

  it('No changes on user or account - single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);
    _.set(message1, "changes.user", {});
    _.set(message1, "changes.account", {});
    _.set(message1, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
    _.set(message1, "account_segments", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);

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
        account_segments: ["account_segment_1"],
        account_attributes: ["domain"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });

  it('Both account and user pass segment whitelists. No attribute whitelists defined. - Filter single message sent to Zapier', async () => {
    const message1 = _.cloneDeep(userAttributeUpdatedPayload);
    _.set(message1, "changes.user", { "name": ["old_1", "new_1"]});
    _.set(message1, "changes.account", { "domain": ["old_domain_1", "new_domain_1"]});
    _.set(message1, "segments", [{ "id": "user_segment_1", "name": "UserSegment1" }]);
    _.set(message1, "account_segments", [{ "id": "account_segment_1", "name": "AccountSegment1" }]);

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
        account_segments: ["all_segments"]
      },

      cleanedRequest: message1
    };

    const results = await appTester(
      App.triggers['user_attribute_updated'].operation.perform,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(0);
  });
});
