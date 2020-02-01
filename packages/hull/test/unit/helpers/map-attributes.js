const { expect } = require("chai");

const mapAttributes = require("../../../src/helpers/map-attributes");
const operations = require("../../../src/helpers/operations");

function buildCtx(settings) {
  return {
    helpers: {
      operations: operations()
    },
    connectorConfig: {
      manifest: {
        mappings: {
          person: {
            incoming: {
              mapping: [
                {
                  service: "gravatar.avatars.url",
                  hull: "gravatars",
                  overwrite: true
                }
              ]
            }
          }
        },
        private_settings: {
          "name": "incoming_prospect_mapping",
          "title": "Clearbit Prospect Mapping",
          "description": "How we map Clearbit Prospects to Hull Users",
          "type": "array",
          "format": "traitMapping",
          "options": {
            "direction": "incoming",
            "showOverwriteToggle": true,
            "allowCreate": true,
            "placeholder": "Clearbit Person Field",
            "loadOptions": "/schema/prospect_properties",
            "source": "clearbit"
          },
          default: "#/mappings/prospect/incoming/mapping"
        }
      }
    },
    connector: {
      private_settings: settings
    }
  };
}

describe("jsonata", () => {
  it("should properly apply JSONATA Transforms", () => {
    const ctx = buildCtx({
      incoming_prospect_mapping: [
        {
          service: "gravatar.avatars.url",
          hull: "gravatars",
          overwrite: true
        }
      ]
    });
    const response = mapAttributes(ctx)({
      entity: {
        gravatar: {
          avatars: [{ url: "http://foo.com" }, { url: "http://foo.com" }]
        }
      },
      mapping: "incoming_prospect_mapping",
      type: "person",
      direction: "incoming"
    });
  });
  it("should apply setIfNull if overwrite is false", () => {
    const ctx = buildCtx({
      incoming_prospect_mapping: [
        {
          service: "gravatar.avatars.url",
          hull: "gravatars",
          overwrite: false
        }
      ]
    });
    const response = mapAttributes(ctx)({
      mapping: "incoming_prospect_mapping",
      entity: {
        gravatar: {
          avatars: { operation: "setIfNull", value: [{ url: "http://foo.com" }, { url: "http://foo.com" }] }
        }
      },
      type: "person",
      direction: "incoming"
    });
  });
});
