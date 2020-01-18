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
          name: "incoming_prospect_mapping",
          title: "Clearbit Prospect Mapping",
          description: "How we map Clearbit Prospects to Hull Users",
          type: "array",
          format: "traitMapping",
          options: {
            direction: "incoming",
            showOverwriteToggle: true,
            allowCreate: true,
            placeholder: "Clearbit Person Field",
            loadOptions: "/schema/prospect_properties",
            source: "clearbit"
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
  const incoming_prospect_mapping = [
    {
      service: "gravatar.avatars.url",
      hull: "gravatars",
      overwrite: true
    }
  ];
  it("should properly apply JSONATA Transforms", () => {
    const ctx = buildCtx({
      incoming_prospect_mapping
    });
    const response = mapAttributes(ctx)({
      payload: {
        gravatar: {
          avatars: [{ url: "http://foo.com" }, { url: "http://foo.com" }]
        }
      },
      direction: "incoming",
      mapping: incoming_prospect_mapping
    });
  });
  it("should apply setIfNull if overwrite is false", () => {
    const incoming_prospect_mapping2 = [
      {
        service: "gravatar.avatars.url",
        hull: "gravatars",
        overwrite: false
      }
    ];
    const ctx = buildCtx({
      incoming_prospect_mapping2
    });
    const response = mapAttributes(ctx)({
      mapping: incoming_prospect_mapping2,
      direction: "incoming",
      payload: {
        gravatar: {
          avatars: {
            operation: "setIfNull",
            value: [{ url: "http://foo.com" }, { url: "http://foo.com" }]
          }
        }
      }
    });
  });
});
