/* global describe, test, expect */

const QueryUtil = require("../../server/lib/sync-agent/query-util");
const { getContextMock } = require("./support/hull-mock");
const getMappings = require("../../server/lib/sync-agent/mapping-util");
const expect = require("expect");

describe("composeFindFields", () => {
  it("should compose the fields for all object types", () => {
    const queryUtil = new QueryUtil();
    const lead_attributes_outbound = [
      { hull: "email",
        service: "Email",
        overwrite: false },
      { hull: "traits_intercom/citygroup",
        service: "City",
        overwrite: true },
      { hull: "traits_company",
        service: "Company",
        overwrite: true }];
    const lead_attributes_inbound = [
      {
        hull: "OwnerId",
        service: "OwnerId"
      }
    ];
    const contact_attributes_outbound = [];
    const account_attributes_outbound = [];
    const account_attributes_inbound = [];
    const ctx = getContextMock({ lead_attributes_outbound, lead_attributes_inbound, contact_attributes_outbound, account_attributes_outbound, account_attributes_inbound });
    const mappings = getMappings(ctx.ship);

    const findFieldsAccount = queryUtil.composeFindFields("account", mappings);
    expect(findFieldsAccount).toEqual(["Id", "Website"]);

    const findFieldsContact = queryUtil.composeFindFields("Contact", mappings);
    expect(findFieldsContact).toEqual(["Email", "FirstName", "LastName", "Id", "AccountId"]);

    const findFieldsLead = queryUtil.composeFindFields("Lead", mappings);
    expect(findFieldsLead).toEqual(["Email", "City", "Company", "FirstName", "LastName", "Id", "ConvertedAccountId", "ConvertedContactId", "OwnerId"]);
  });
});
