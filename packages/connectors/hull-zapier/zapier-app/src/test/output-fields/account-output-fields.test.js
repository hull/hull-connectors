require('should');
const nock = require('nock');
const _ = require("lodash");
const zapier = require('zapier-platform-core');

process.env.CONNECTOR_URL = "https://hull-zapier.ngrok.io";
process.env.TOKEN = "YOUR_TOKEN";

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Account Output Fields Test', () => {
  zapier.tools.env.inject();
  const connector_url = process.env.CONNECTOR_URL;

  it('Account Attribute Output Fields', async () => {
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
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const enteredSegmentResults = await appTester(
      App.triggers["account_entered_segment"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const leftSegmentResults = await appTester(
      App.triggers["account_left_segment"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const attrUpdatedResults = await appTester(
      App.triggers["account_attribute_updated"].operation.outputFields,
      bundle
    );

    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" },
        { "name": "account.industry" }
      ]);

    const createdResults = await appTester(
      App.triggers["account_created"].operation.outputFields,
      bundle
    );

    enteredSegmentResults.should.be.an.Array();
    enteredSegmentResults.should.have.lengthOf(2);

    enteredSegmentResults.should.deepEqual(leftSegmentResults);
    enteredSegmentResults.should.deepEqual(attrUpdatedResults);
    enteredSegmentResults.should.deepEqual(createdResults);

    enteredSegmentResults.should.deepEqual(
      [
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
