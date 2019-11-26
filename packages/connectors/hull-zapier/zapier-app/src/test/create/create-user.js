const _ = require("lodash");
const nock = require('nock');
require('should');

const zapier = require('zapier-platform-core');

process.env.CONNECTOR_URL = "https://hull-zapier.ngrok.io";

const App = require('../../index');
const appTester = zapier.createAppTester(App);


describe('Action - User Created', () => {
  zapier.tools.env.inject();
  const connector_url = process.env.CONNECTOR_URL;

  it('User Created - Simple', async () => {

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        email: "al@alincorporated.com",
        attributes: {
          "pipedrive/department": "marketing",
          "name": "Andy Hull",
          "pipedrive/id": "pipedrive_id"
        }
      },
    };

    const claims = {
      "email": "al@alincorporated.com"
    };
    const attributes = {
      "pipedrive/department": "marketing",
      "name": "Andy Hull",
      "pipedrive/id": "pipedrive_id"
    };
    const scope = nock(connector_url)
      .post("/create?token=YOUR_TOKEN",
        { entityType: "user", claims, attributes }
      )
      .reply(200, {
        data: {
          ok: true
        },
        status: 200
      });

    const results = await appTester(
      App.creates['user'].operation.perform,
      bundle
    );
    results.should.deepEqual({ data: { ok: true }, status: 200 });
  });

  it('User Created - Empty Input Data', async () => {

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        email: "al@alincorporated.com",
        external_id: "",
        attributes: {
          "pipedrive/department": "marketing",
          "name": "Andy Hull",
          "pipedrive/id": "pipedrive_id"
        }
      },
    };

    const claims = {
      "email": "al@alincorporated.com"
    };
    const attributes = {
      "pipedrive/department": "marketing",
      "name": "Andy Hull",
      "pipedrive/id": "pipedrive_id"
    };
    const scope = nock(connector_url)
      .post("/create?token=YOUR_TOKEN",
        { entityType: "user", claims, attributes }
      )
      .reply(200, {
        data: {
          ok: true
        },
        status: 200
      });

    const results = await appTester(
      App.creates['user'].operation.perform,
      bundle
    );
    results.should.deepEqual({ data: { ok: true }, status: 200 });
  });

  it('User Created - Wrong Input Data', async () => {

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        email: "al@alincorporated.com",
        external_id: "",
        random_field: "blah blah",
        attributes: {
          "pipedrive/department": "marketing",
          "name": "Andy Hull",
          "pipedrive/id": "pipedrive_id"
        }
      },
    };

    const claims = {
      "email": "al@alincorporated.com"
    };
    const attributes = {
      "pipedrive/department": "marketing",
      "name": "Andy Hull",
      "pipedrive/id": "pipedrive_id"
    };
    const scope = nock(connector_url)
      .post("/create?token=YOUR_TOKEN",
        { entityType: "user", claims, attributes }
      )
      .reply(200, {
        data: {
          ok: true
        },
        status: 200
      });

    const results = await appTester(
      App.creates['user'].operation.perform,
      bundle
    );
    results.should.deepEqual({ data: { ok: true }, status: 200 });
  });
});
