/* global describe, test, expect */
const _ = require("lodash");
const { getContextMock } = require("./support/hull-mock");
const { getMappings } = require("../../server/lib/sync-agent/mapping-util");
const expect = require("expect");

describe("getMappings", () => {
  it("BaseMapping", () => {
    const ctx = getContextMock({});
    const { Lead, Contact, Account } = getMappings(ctx.ship);

    // Account fields
    expect(Account.type).toEqual("Account");
    expect(Account.fetchFields.Id).toEqual("id");
    expect(Account.fetchFields.Website).toEqual("website");
    expect(_.keys(Account.fields).length).toEqual(0);

    // Account fields
    expect(Contact.type).toEqual("Contact");
    expect(Lead.type).toEqual("Lead");
  });

  it("Custom lead_attributes_outbound", () => {
    const lead_attributes_outbound = [
      { hull: "hello/world", service: "HelloWorld", overwrite: true }
    ];

    const ctx = getContextMock({ lead_attributes_outbound });
    const { Lead } = getMappings(ctx.ship);

    // Custom Lead fields
    expect(Lead.type).toEqual("Lead");
    expect(Lead.fields.HelloWorld.key).toEqual("hello/world");
    expect(Lead.fields.HelloWorld.overwrite).toEqual(true);
  });

  it("Custom lead_attributes_inbound", () => {
    const lead_attributes_inbound = [
      {
        hull: "boom",
        service: "Boom",
      },
      {
        hull: "yeah",
        service: "Yeah"
      }
    ];

    const ctx = getContextMock({ lead_attributes_inbound });
    const { Lead } = getMappings(ctx.ship);

    // Custom Lead fetchFields
    expect(Lead.type).toEqual("Lead");
    expect(_.keys(Lead.fetchFields)).toEqual(expect.arrayContaining(["Boom", "Yeah"]));
  });

  it("should handle incomplete settings in outbound mapping by skipping it", () => {
    const lead_attributes_outbound = [
      { overwrite: true },
      { hull: "hello/world" },
      { service: "HelloWorld" }
    ];
    const ctx = getContextMock({ lead_attributes_outbound });
    const { Lead } = getMappings(ctx.ship);

    expect(Lead.fields).toEqual({});
  });
});
