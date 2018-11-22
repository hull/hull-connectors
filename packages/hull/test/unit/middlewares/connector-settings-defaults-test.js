const { expect } = require("chai");
const connectorSettingsDefaultsMiddleware = require("../../../src/middlewares/connector-settings-defaults");

function buildReq(connector) {
  return {
    hull: {
      connector
    }
  };
}

describe("connectorSettingsDefaultsMiddleware", () => {
  it("should apply defaults to all undefined settings", () => {
    const reqStub = buildReq({
      private_settings: {
        existing_array_field: [],
        existing_string_field: "",
        existing_nulled_field: null,
        existing_undefined_field: undefined
      },
      manifest: {
        private_settings: [{
          name: "existing_array_field",
          format: "trait",
          type: "string",
          default: ["A", "B"]
        }, {
          name: "non_existing_array_field",
          format: "trait",
          type: "string",
          default: ["A", "B"]
        }, {
          name : "non_existing_complex_field",
          type: "array",
          "default": [
            {
              "hull": "email",
              "service": "$['identity-profiles'][*].identities[?(@.type === 'EMAIL')].value",
              "required": false
            },
            {
              "hull": "email",
              "service": "properties.email.value",
              "required": false
            }
          ]
        }, {
          "name": "existing_nulled_field",
          "type": "string",
          default: "foo"
        }, {
          "name": "existing_undefined_field",
          "type": "string",
          default: "bar"
        }]
      }
    });
    connectorSettingsDefaultsMiddleware()(reqStub, {}, () => {});
    const trimmedConnector = reqStub.hull.connector;
    expect(trimmedConnector).to.eql({
      manifest: reqStub.hull.connector.manifest,
      private_settings: {
        existing_array_field: [],
        existing_string_field: "",
        existing_nulled_field: null,
        non_existing_array_field: ["A", "B"],
        non_existing_complex_field: [
          {
            "hull": "email",
            "service": "$['identity-profiles'][*].identities[?(@.type === 'EMAIL')].value",
            "required": false
          },
          {
            "hull": "email",
            "service": "properties.email.value",
            "required": false
          }
        ],
        existing_undefined_field: "bar"
      }
    });
  });
});
