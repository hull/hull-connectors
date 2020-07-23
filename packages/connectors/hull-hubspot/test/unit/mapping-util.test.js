// @flow

const _ = require("lodash");
const companyPropertyGroups = require("../integration/fixtures/get-properties-companies-groups.json");
const MappingUtil = require("../../server/lib/sync-agent/mapping-util");
const expect = require("expect");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = 1;
process.env.CLIENT_SECRET = 1;

describe("Mapping Util Unit Tests", () => {
  it("Should fetch recent companies", () => {
    const private_settings = {
      incoming_account_claims: [
        { "hull": "domain", "service": "properties.domain.value" }
      ],
      incoming_account_attributes: [
        { "service": "companyId", "hull": "hubspot/id" },
        { "service": "properties.about_us.value", "hull": "hubspot/about_us" },
        { "service": "properties.country.value & something", "hull": "hubspot/country" },
        { "service": "$number(properties.numemployees.value)", "hull": "hubspot/numemployees" },
        { "service": "adfafdproperties.zip.valueasf)", "hull": "hubspot/zip" },
        { "service": "adfafdproperties.address.valu)", "hull": "hubspot/address" },
        { "service": "propertiesstate.value)", "hull": "hubspot/state" },
        { "service": "properties.namevalue)", "hull": "hubspot/state" }
      ]
    };
    const mappingUtil = new MappingUtil({
      ctx: {},
      connector: {
        private_settings
      },
      hullClient: {},
      usersSegments: [],
      accountsSegments: [],
      hubspotContactProperties: [],
      hubspotCompanyProperties: companyPropertyGroups
    });

    const propertyKeys = mappingUtil.getHubspotPropertyKeys({
      identityClaims: private_settings.incoming_account_claims,
      attributeMapping: private_settings.incoming_account_attributes
    });
    console.log("");
    expect(propertyKeys).toEqual([
      "about_us",
      "country",
      "numemployees",
      "zip",
      "domain"
    ]);
  });
});
