const { expect } = require("chai");
const trimTraitsPrefixFromConnector = require("../../../src/utils/trim-traits-prefix-from-connector");

function buildReq(connector) {
  return {
    hull: {
      connector
    }
  };
}

describe("trimTraitsPrefixFromConnector", () => {
  it("should trim all traits fields in the connector", () => {
    const connector = {
      private_settings: {
        some_other_field: "traits_to_not_remove",
        some_other_object: {
          nested_param: "traits_to_not_remove"
        },
        some_other_table: [{
          nested_param: "traits_to_not_remove"
        }],
        testing_single_trait: "traits_to_remove",
        testing_array_traits: ["traits_to_remove"],
        incoming_user_attributes: [{
          name: "traits_to_not_remove",
          hull: "traits_to_remove"
        }, {
          name: "",
          hull: ""
        }, {}],
        outgoing_user_attributes: [{
          service: "traits_to_not_remove",
          hull: "traits_to_remove"
        }, {
          service: "",
          hull: ""
        }, {}]
      },
      manifest: {
        private_settings: [{
          "name": "testing_single_trait",
          "format": "trait",
          "type": "string"
        }, {
          "name": "testing_array_traits",
          "format": "trait",
          "type": "array"
        }, {
          "name" : "incoming_user_attributes",
          "type": "array",
          "items" : {
            "type" : "object",
            "properties" : {
              "name" : {
                "type" : "string",
                "format": "select",
              },
              "hull" : {
                "type" : "string",
                "format" : "trait",
              }
            }
          }
        }, {
          "name": "outgoing_user_attributes",
          "type": "array",
          "format": "trait-mapping"
        }]
      }
    };
    trimTraitsPrefixFromConnector(connector);
    expect(connector).to.eql({
      manifest: connector.manifest,
      private_settings: {
        some_other_field: "traits_to_not_remove",
        some_other_object: { nested_param: "traits_to_not_remove" },
        some_other_table: [{ nested_param: "traits_to_not_remove" }],
        testing_single_trait: "to_remove",
        testing_array_traits: ["to_remove"],
        incoming_user_attributes: [{
          name: "traits_to_not_remove",
          hull: "to_remove"
        }, {
          name: "",
          hull: ""
        }, {}],
        outgoing_user_attributes: [{
          service: "traits_to_not_remove",
          hull: "to_remove"
        }, {
          service: "",
          hull: ""
        },
        {
        }]
      }
    });
  });
});
