const _ = require("lodash");
const nock = require('nock');
require('should');

const zapier = require('zapier-platform-core');

process.env.CONNECTOR_URL = "https://hull-zapier.ngrok.io";

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Action - Account Created', () => {
  zapier.tools.env.inject();
  const connector_url = process.env.CONNECTOR_URL;

  it('Account Created - Simple', async () => {

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        domain: "alincorporated.com",
        attributes: {
          "pipedrive/industry": "software",
          "name": "AlIncorporated"
        }
      },
    };

    const claims = {
      "domain": "alincorporated.com"
    };
    const attributes = {
      "pipedrive/industry": "software",
      "name": "AlIncorporated"
    };
    const scope = nock(connector_url)
      .post("/create?token=YOUR_TOKEN",
        { entityType: "account", claims, attributes }
      )
      .reply(200, {
        data: {
          ok: true
        },
        status: 200
      });

    const results = await appTester(
      App.creates['account'].operation.perform,
      bundle
    );
    results.should.deepEqual({ data: { ok: true }, status: 200 });
  });

  it('Account Created - Empty Input Data', async () => {

    const bundle = {
      authData: {
        token: process.env.TOKEN,
        oauth_consumer_key: process.env.OAUTH_CONSUMER_KEY,
        oauth_consumer_secret: process.env.OAUTH_CONSUMER_SECRET,
        oauth_token: process.env.OAUTH_TOKEN,
        oauth_token_secret: process.env.OAUTH_TOKEN_SECRET
      },

      inputData: {
        domain: "alincorporated.com",
        external_id: null,
        attributes: {
          "pipedrive/industry": "software",
          "name": "AlIncorporated"
        }
      },
    };

    const claims = {
      "domain": "alincorporated.com"
    };
    const attributes = {
      "pipedrive/industry": "software",
      "name": "AlIncorporated"
    };
    const scope = nock(connector_url)
      .post("/create?token=YOUR_TOKEN",
        { entityType: "account", claims, attributes }
      )
      .reply(200, {
        data: {
          ok: true
        },
        status: 200
      });

    const results = await appTester(
      App.creates['account'].operation.perform,
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
        domain: "alincorporated.com",
        random_field: "random field value",
        attributes: {
          "pipedrive/industry": "software",
          "name": "AlIncorporated"
        }
      },
    };

    const claims = {
      "domain": "alincorporated.com"
    };
    const attributes = {
      "pipedrive/industry": "software",
      "name": "AlIncorporated"
    };
    const scope = nock(connector_url)
      .post("/create?token=YOUR_TOKEN",
        { entityType: "account", claims, attributes }
      )
      .reply(200, {
        data: {
          ok: true
        },
        status: 200
      });

    const results = await appTester(
      App.creates['account'].operation.perform,
      bundle
    );
    results.should.deepEqual({ data: { ok: true }, status: 200 });
  });
});
