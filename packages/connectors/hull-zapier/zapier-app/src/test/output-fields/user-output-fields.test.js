require('should');
const nock = require('nock');
const _ = require("lodash");
const zapier = require('zapier-platform-core');

process.env.CONNECTOR_URL = "https://hull-zapier.ngrok.io";
process.env.TOKEN = "YOUR_TOKEN";

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('User Output Fields Test', () => {
  zapier.tools.env.inject();
  const connector_url = process.env.CONNECTOR_URL;

  it('User Attribute Output Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };
    const scope = nock(connector_url);

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "user.email" },
        { "name": "user.salesforce_contact/department" },
        { "name": "user.pipedrive/description" }
      ]);

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const userEnteredSegmentResults = await appTester(
      App.triggers["user_entered_segment"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "user.email" },
        { "name": "user.salesforce_contact/department" },
        { "name": "user.pipedrive/description" }
      ]);

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const userLeftSegmentResults = await appTester(
      App.triggers["user_left_segment"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "user.email" },
        { "name": "user.salesforce_contact/department" },
        { "name": "user.pipedrive/description" }
      ]);

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const userAttrUpdatedResults = await appTester(
      App.triggers["user_attribute_updated"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "user.email" },
        { "name": "user.salesforce_contact/department" },
        { "name": "user.pipedrive/description" }
      ]);

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const userCreatedResults = await appTester(
      App.triggers["user_created"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "user.email" },
        { "name": "user.salesforce_contact/department" },
        { "name": "user.pipedrive/description" }
      ]);

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const userEventCreatedResults = await appTester(
      App.triggers["user_event_created"].operation.outputFields,
      bundle
    );

    userEnteredSegmentResults.should.be.an.Array();
    userEnteredSegmentResults.should.have.lengthOf(5);

    userEnteredSegmentResults.should.deepEqual(userLeftSegmentResults);
    userEnteredSegmentResults.should.deepEqual(userAttrUpdatedResults);
    userEnteredSegmentResults.should.deepEqual(userCreatedResults);
    userEnteredSegmentResults.should.deepEqual(userEventCreatedResults);

    userEnteredSegmentResults.should.deepEqual(
      [
        {
          "key": "user__email",
          "label": "user.email"
        },
        {
          "key": "user__salesforce_contact/department",
          "label": "user.salesforce_contact/department"
        },
        {
          "key": "user__pipedrive/description",
          "label": "user.pipedrive/description"
        },
        {
          "key": "account__domain",
          "label": "account.domain"
        },
        {
          "key": "account__industry",
          "label": "account.industry"
        },
      ]
    );
    nock.isDone().should.eql(true);
  });

});
