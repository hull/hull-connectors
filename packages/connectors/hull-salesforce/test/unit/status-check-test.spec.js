// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
const expect = require("expect");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

describe("Status Check", () => {
  it("Should return a missing access token error", () => {
    const connector = {
      private_settings: {
        instance_url: "123.saleesforce.com",
        refresh_token: "RefreshToken",
        login_url: "B",
        salesforce_login: "login",
        salesforce_password: "password",
        lead_attributes_outbound: [{ service: "A", hull: "B" }],
        lead_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_outbound: [{ service: "A", hull: "B" }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "setupRequired",
          messages: [
            "External service credentials aren’t set: missing API access token."
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "setupRequired", "messages": ["External service credentials aren’t set: missing API access token."] }
          ]
        ]
      };
    });
  });

  it("Should return a missing refresh token error", () => {
    const connector = {
      private_settings: {
        instance_url: "Hey",
        access_token: "AccessToken",
        salesforce_login: "login",
        login_url: "B",
        salesforce_password: "password",
        lead_attributes_outbound: [{ service: "A", hull: "B" }],
        lead_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_outbound: [{ service: "A", hull: "B" }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "setupRequired",
          messages: [
            "External service credentials aren’t set: missing API refresh token."
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "setupRequired", "messages": ["External service credentials aren’t set: missing API refresh token."] }
          ]
        ]
      };
    });
  });

  it("Should return a no leads will be sent message due to missing configuration", () => {
    const connector = {
      private_settings: {
        instance_url: "Hey",
        refresh_token: "RefreshToken",
        login_url: "B",
        access_token: "AccessToken",
        salesforce_login: "login",
        salesforce_password: "password",
        oauth2: {
          clientId: "id",
          clientSecret: "secret",
          redirectUri: "uri"
        },
        lead_attributes_outbound: [],
        lead_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_outbound: [{ service: "A", hull: "B" }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "ok",
          messages: [
            "No leads will be sent from Hull to Salesforce due to missing configuration"
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "ok", "messages": ["No leads will be sent from Hull to Salesforce due to missing configuration"] }
          ]
        ]
      };
    });
  });

  it("Should return a no leads will be fetched message due to missing configuration", () => {
    const connector = {
      private_settings: {
        instance_url: "Hey",
        refresh_token: "RefreshToken",
        access_token: "AccessToken",
        login_url: "B",
        salesforce_login: "login",
        salesforce_password: "password",
        oauth2: {
          clientId: "id",
          clientSecret: "secret",
          redirectUri: "uri"
        },
        lead_attributes_outbound: [{ service: "A", hull: "B" }],
        lead_attributes_inbound: [],
        contact_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_outbound: [{ service: "A", hull: "B" }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "ok",
          messages: [
            "No lead fields will be fetched from Salesforce due to missing configuration"
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "ok", "messages": ["No lead fields will be fetched from Salesforce due to missing configuration"] }
          ]
        ]
      };
    });
  });

  it("Should return a no contacts fields will be fetched message due to missing configuration", () => {
    const connector = {
      private_settings: {
        instance_url: "Hey",
        refresh_token: "RefreshToken",
        access_token: "AccessToken",
        login_url: "B",
        salesforce_login: "login",
        salesforce_password: "password",
        oauth2: {
          clientId: "id",
          clientSecret: "secret",
          redirectUri: "uri"
        },
        lead_attributes_outbound: [{ service: "A", hull: "B" }],
        lead_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_inbound: [],
        contact_attributes_outbound: [{ service: "A", hull: "B" }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "ok",
          messages: [
            "No contacts fields will be fetched from Salesforce due to missing configuration"
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "ok", "messages": ["No contacts fields will be fetched from Salesforce due to missing configuration"] }
          ]
        ]
      };
    });
  });

  it("Should return a no contacts fields will be sent message due to missing configuration", () => {
    const connector = {
      private_settings: {
        instance_url: "Hey",
        refresh_token: "RefreshToken",
        access_token: "AccessToken",
        login_url: "B",
        salesforce_login: "login",
        salesforce_password: "password",
        oauth2: {
          clientId: "id",
          clientSecret: "secret",
          redirectUri: "uri"
        },
        lead_attributes_outbound: [{ service: "A", hull: "B" }],
        lead_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_outbound: []
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "ok",
          messages: [
            "No contacts will be sent from Hull to Salesforce due to missing configuration"
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "ok", "messages": ["No contacts will be sent from Hull to Salesforce due to missing configuration"] }
          ]
        ]
      };
    });
  });

  it("Should return a credentials error", () => {
    const connector = {
      private_settings: {
        login_url: "B",
        lead_attributes_outbound: [{ service: "A", hull: "B" }],
        lead_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_inbound: [{ service: "A", hull: "B" }],
        contact_attributes_outbound: [{ service: "A", hull: "B" }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {},
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          status: "setupRequired",
          messages: [
            "External service credentials aren’t set: missing API login and password"
          ]
        },
        logs: [],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: [
          [
            "PUT", "/api/v1/9993743b22d60dd829001999/status", {},
            { "status": "setupRequired", "messages": ["External service credentials aren’t set: missing API login and password"] }
          ]
        ]
      };
    });
  });
});
