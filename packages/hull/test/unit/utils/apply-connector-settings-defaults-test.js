const { expect } = require("chai");
const applyConnectorSettingsDefaults = require("../../../src/utils/apply-connector-settings-defaults");

describe("applyConnectorSettingsDefaults", () => {
  it("should apply defaults to all undefined settings", () => {
    const connector = {
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
    };
    applyConnectorSettingsDefaults(connector);
    expect(connector).to.eql({
      manifest: connector.manifest,
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
