require('should');
const nock = require('nock');
const _ = require("lodash");
const zapier = require('zapier-platform-core');

process.env.CONNECTOR_URL = "https://hull-zapier.ngrok.io";
process.env.TOKEN = "YOUR_TOKEN";

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Account Input Fields Test', () => {
  zapier.tools.env.inject();
  const connector_url = process.env.CONNECTOR_URL;

  it('Account Created Input Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };

    const scope = nock(connector_url)
      .post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        {"label": "AccountSegment1", "value": "1"}, {"label": "AccountSegment2", "value": "2"}
      ]);

    const results = await appTester(
      App.triggers["account_created"].operation.inputFields,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);

    results[0].should.deepEqual({
      "key": "account_segments",
      "required": true,
      "label": "Account Segment",
      "list": true,
      "choices": [
        {
          "value": "all_segments",
          "label": "All Account Segments"
        },
        {
          "label": "AccountSegment1",
          "value": "1"
        },
        {
          "label": "AccountSegment2",
          "value": "2"
        }
      ]
    })
  });

  it('Account Entered Segment Input Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };

    const scope = nock(connector_url)
      .post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        {"label": "AccountSegment1", "value": "1"}, {"label": "AccountSegment2", "value": "2"}
      ]);

    const results = await appTester(
      App.triggers["account_entered_segment"].operation.inputFields,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);

    results[0].should.deepEqual({
      "key": "account_segments",
      "required": true,
      "label": "Account Segment",
      "list": true,
      "choices": [
        {
          "value": "all_segments",
          "label": "All Account Segments"
        },
        {
          "label": "AccountSegment1",
          "value": "1"
        },
        {
          "label": "AccountSegment2",
          "value": "2"
        }
      ]
    })
  });

  it('Account Left Segment Input Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };

    const scope = nock(connector_url)
      .post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        {"label": "AccountSegment1", "value": "1"}, {"label": "AccountSegment2", "value": "2"}
      ]);

    const results = await appTester(
      App.triggers["account_left_segment"].operation.inputFields,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);

    results[0].should.deepEqual({
      "key": "account_segments",
      "required": true,
      "label": "Account Segment",
      "list": true,
      "choices": [
        {
          "value": "all_segments",
          "label": "All Account Segments"
        },
        {
          "label": "AccountSegment1",
          "value": "1"
        },
        {
          "label": "AccountSegment2",
          "value": "2"
        }
      ]
    })
  });

  it('Account Attribute Changed Input Fields', async () => {
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

    // Account Segments
    scope.post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        { "label": "AccountSegment1", "value": "1" }, { "label": "AccountSegment2", "value": "2" }
      ]);

    // Account Schema
    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" }
      ]);

    const results = await appTester(
      App.triggers["account_attribute_updated"].operation.inputFields,
      bundle
    );

    results.should.be.an.Array();
    results.should.have.lengthOf(2);

    results.should.deepEqual(
      [
        {
          "key": "account_segments",
          "required": true,
          "label": "Account Segment",
          "list": true,
          "choices": [
            {
              "value": "all_segments",
              "label": "All Account Segments"
            },
            {
              "label": "AccountSegment1",
              "value": "1"
            },
            {
              "label": "AccountSegment2",
              "value": "2"
            }
          ]
        },
        {
          "key": "account_attributes",
          "required": true,
          "label": "Account Attributes",
          "list": true,
          "choices": [
            {
              "label": "domain",
              "value": "domain"
            }
          ]
        }
      ]
    );
    nock.isDone().should.eql(true);
  });
});
