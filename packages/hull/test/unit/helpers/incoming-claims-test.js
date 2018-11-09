const { expect } = require("chai");

const incomingClaims = require("../../../src/helpers/incoming-claims");

function buildCtx(settings) {
  return {
    connector: {
      private_settings: settings
    }
  };
}

describe.only("incoming claims builder", () => {
  it("should not return claims but an error if valid settings are not provided", () => {
    const accountClaims = incomingClaims({}, "account", {});
    expect(accountClaims).to.eql({
      error: "The incoming claims configuration for account is missing."
    });
  });

  it("should skip an entry which is missing some information", () => {
    const ctx = buildCtx({
      incoming_account_claims: [{
        hull: "external_id",
      }, {
        service: "custom_id",
        required: true
      }, {
        hull: "domain",
        service: "some_domain"
      }]
    });
    const accountClaims = incomingClaims(ctx, "account", { some_domain: "valueForDomain" });
    expect(accountClaims).to.eql({
      claims: {
        domain: "valueForDomain"
      }
    });
  });

  it("should return an error if required value is not present", () => {
    const ctx = buildCtx({
      incoming_account_claims: [{
        hull: "external_id",
        service: "custom_id",
        required: true
      }]
    });
    const accountClaims = incomingClaims(ctx, "account", {});
    expect(accountClaims).to.eql({
      error: "Value of field \"custom_id\" is empty, cannot map it to external_id, but it's required."
    });
  });

  it("should map all possible values", () => {
    const ctx = buildCtx({
      incoming_account_claims: [{
        hull: "external_id",
        service: "custom_id",
        required: true
      }, {
        hull: "domain",
        service: "some_domain"
      }]
    });
    const accountClaims = incomingClaims(ctx, "account", { custom_id: "valueForExternalId", some_domain: "valueForDomain" });
    expect(accountClaims).to.eql({
      claims: {
        external_id: "valueForExternalId",
        domain: "valueForDomain"
      }
    });
  });

  it("should skip blank value, undefined, null or empty strings", () => {
    const ctx = buildCtx({
      incoming_account_claims: [{
        hull: "external_id",
        service: "custom_id",
      }, {
        hull: "domain",
        service: "some_domain"
      }, {
        hull: "anonymous_id",
        service: "some_anonymous_id"
      }]
    });
    const accountClaims = incomingClaims(ctx, "account", { custom_id: null, some_domain: "   " });
    expect(accountClaims).to.eql({
      error: "All configured fields for claims are empty: custom_id, some_domain, some_anonymous_id"
    });
  });

  it("should skip any non string and non numeric value", () => {
    const ctx = buildCtx({
      incoming_account_claims: [{
        hull: "external_id",
        service: "custom_id",
      }, {
        hull: "domain",
        service: "some_domain"
      }, {
        hull: "anonymous_id",
        service: "some_anonymous_id"
      }]
    });
    const accountClaims = incomingClaims(ctx, "account", { custom_id: true, domain: new Date(), some_anonymous_id: [{ key: "value" }] });
    expect(accountClaims).to.eql({
      error: "All configured fields for claims are empty: custom_id, some_domain, some_anonymous_id"
    });
  })

  it("should return an error if we cannot map any claim", () => {
    const ctx = buildCtx({
      incoming_account_claims: [{
        hull: "external_id",
        service: "custom_id",
      }, {
        hull: "domain",
        service: "some_domain"
      }]
    });
    const accountClaims = incomingClaims(ctx, "account", {});
    expect(accountClaims).to.eql({
      error: "All configured fields for claims are empty: custom_id, some_domain"
    });
  });
});
