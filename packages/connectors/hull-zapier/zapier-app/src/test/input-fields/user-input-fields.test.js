require('should');
const nock = require('nock');
const _ = require("lodash");
const zapier = require('zapier-platform-core');

process.env.CONNECTOR_URL = "https://hull-zapier.ngrok.io";
process.env.TOKEN = "YOUR_TOKEN";

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('User Input Fields Test', () => {
  zapier.tools.env.inject();
  const connector_url = process.env.CONNECTOR_URL;

  it('User Created Input Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };

    nock(connector_url)
      .post("/segments?token=YOUR_TOKEN", { "entityType": "user" })
      .reply(200, [
        {"label": "UserSegment1", "value": "1"}, {"label": "UserSegment2", "value": "2"}
      ]);

    const results = await appTester(
      App.triggers["user_created"].operation.inputFields,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);

    results[0].should.deepEqual({
      "key": "user_segments",
      "required": true,
      "label": "User Segment",
      "list": true,
      "choices": [
        {
          "value": "all_segments",
          "label": "All User Segments"
        },
        {
          "label": "UserSegment1",
          "value": "1"
        },
        {
          "label": "UserSegment2",
          "value": "2"
        }
      ]
    });
    nock.isDone().should.eql(true);
  });

  it('User Entered Segment Input Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };

    nock(connector_url)
      .post("/segments?token=YOUR_TOKEN")
      .reply(200, [
          {"label": "UserSegment1", "value": "1"}, {"label": "UserSegment2", "value": "2"}
      ]);

    const results = await appTester(
      App.triggers["user_entered_segment"].operation.inputFields,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);

    results[0].should.deepEqual({
      "key": "user_segments",
      "required": true,
      "label": "User Segment",
      "list": true,
      "choices": [
        {
          "value": "all_segments",
          "label": "All User Segments"
        },
        {
          "label": "UserSegment1",
          "value": "1"
        },
        {
          "label": "UserSegment2",
          "value": "2"
        }
      ]
    });
    nock.isDone().should.eql(true);
  });

  it('User Left Segment Input Fields', async () => {
    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      }
    };

    nock(connector_url)
      .post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        {"label": "UserSegment1", "value": "1"}, {"label": "UserSegment2", "value": "2"}
      ]);

    const results = await appTester(
      App.triggers["user_left_segment"].operation.inputFields,
      bundle
    );
    results.should.be.an.Array();
    results.should.have.lengthOf(1);

    results[0].should.deepEqual({
      "key": "user_segments",
      "required": true,
      "label": "User Segment",
      "list": true,
      "choices": [
        {
          "value": "all_segments",
          "label": "All User Segments"
        },
        {
          "label": "UserSegment1",
          "value": "1"
        },
        {
          "label": "UserSegment2",
          "value": "2"
        }
      ]
    });
    nock.isDone().should.eql(true);
  });

  it('User Attribute Changed Input Fields', async () => {
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

    // User Segments
    scope.post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        { "label": "UserSegment1", "value": "1" }, { "label": "UserSegment2", "value": "2" }
      ]);

    // Account Segments
    scope.post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        { "label": "AccountSegment1", "value": "1" }, { "label": "AccountSegment2", "value": "2" }
      ]);

    // User Schema
    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "user.email" },
        { "name": "user.salesforce_contact/department" }
      ]);

    // Account Schema
    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        { "name": "account.domain" }
      ]);

    const results = await appTester(
      App.triggers["user_attribute_updated"].operation.inputFields,
      bundle
    );

    results.should.be.an.Array();
    results.should.have.lengthOf(4);

    results.should.deepEqual(
      [
        {
          "key": "user_segments",
          "required": true,
          "label": "User Segment",
          "list": true,
          "choices": [
            {
              "value": "all_segments",
              "label": "All User Segments"
            },
            {
              "label": "UserSegment1",
              "value": "1"
            },
            {
              "label": "UserSegment2",
              "value": "2"
            }
          ]
        },
        {
          "key": "user_attributes",
          "required": false,
          "label": "User Attributes",
          "list": true,
          "choices": [
            {
              "label": "email",
              "value": "email"
            },
            {
              "label": "salesforce_contact/department",
              "value": "salesforce_contact/department"
            }
          ]
        },
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
          "required": false,
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

  it('User Events Input Fields', async () => {
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
    // User Segments
    scope.post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        { "label": "UserSegment1", "value": "1" }, { "label": "UserSegment2", "value": "2" }
      ]);

    // Account Segments
    scope.post("/segments?token=YOUR_TOKEN")
      .reply(200, [
        { "label": "AccountSegment1", "value": "1" }, { "label": "AccountSegment2", "value": "2" }
      ]);

    // User Events
    scope.post("/schema?token=YOUR_TOKEN")
      .reply(200, [
        {"name": "user_event.Email Opened"},
        {"name": "user_event.Email Sent"},
        {"name": "user_event.Email Dropped"}
      ]);

    const results = await appTester(
      App.triggers["user_event_created"].operation.inputFields,
      bundle
    );

    results.should.be.an.Array();
    results.should.have.lengthOf(3);

    results.should.deepEqual([
      {
        "key": "user_events",
        "required": true,
        "label": "User Events",
        "list": true,
        "choices": [
          {
            "label": "Email Opened",
            "value": "Email Opened"
          },
          {
            "label": "Email Sent",
            "value": "Email Sent"
          },
          {
            "label": "Email Dropped",
            "value": "Email Dropped"
          }
        ]
      },
      {
        "key": "user_segments",
        "required": true,
        "label": "User Segment",
        "list": true,
        "choices": [
          {
            "value": "all_segments",
            "label": "All User Segments"
          },
          {
            "label": "UserSegment1",
            "value": "1"
          },
          {
            "label": "UserSegment2",
            "value": "2"
          }
        ]
      },
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
      }
    ]);
    nock.isDone().should.eql(true);
  });

});
