const { expect } = require("chai");

const incomingClaims = require("../../../src/helpers/incoming-claims");

function buildCtx(settings) {
  return {
    connector: {
      private_settings: settings
    }
  };
}

describe("incoming claims builder", () => {
  it("should not return claims but an error if valid settings are not provided", () => {
    const accountClaims = incomingClaims({})("account", {});
    expect(accountClaims).to.eql({
      error: "The incoming claims configuration for account is missing."
    });
  });

  it("should skip an entry which is missing any information", () => {
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
    const accountClaims = incomingClaims(ctx)("account", { some_domain: "valueForDomain" });
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
    const accountClaims = incomingClaims(ctx)("account", {});
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
    const accountClaims = incomingClaims(ctx)("account", { custom_id: "valueForExternalId", some_domain: "valueForDomain" });
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
    const accountClaims = incomingClaims(ctx)("account", { custom_id: null, some_domain: "   " });
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
    const accountClaims = incomingClaims(ctx)("account", { custom_id: true, domain: new Date(), some_anonymous_id: [{ key: "value" }] });
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
    const accountClaims = incomingClaims(ctx)("account", {});
    expect(accountClaims).to.eql({
      error: "All configured fields for claims are empty: custom_id, some_domain"
    });
  });

  it("should allow to use jsonpath expressions", () => {
    const ctx = buildCtx({
      incoming_user_claims: [
        {
          "hull": "email",
          "service": "$['identity-profiles'][*].identities[?(@.type === 'EMAIL')].value",
          "required": false
        },
        {
          "hull": "external_id",
          "service": "properties.custom_id.value",
          "required": true
        }
      ]
    });
    const userClaims = incomingClaims(ctx)("user", {
      "identity-profiles": [
        {
          "vid": 3234574,
          "saved-at-timestamp": 1484026585613,
          "deleted-changed-timestamp": 0,
          "identities": [
            {
              "type": "EMAIL",
              "value": "testingapis@hubspot.com",
              "timestamp": 1484026585538
            },
            {
              "type": "LEAD_GUID",
              "value": "4b11f8af-50d9-4665-9c43-bb2fc46e3a80",
              "timestamp": 1484026585610
            }
          ]
        }
      ],
      properties: {
        custom_id: {
          value: "customIdValue"
        }
      }
    });
    expect(userClaims).to.eql({
      claims: {
        email: "testingapis@hubspot.com",
        external_id: "customIdValue"
      }
    });
  });

  it("should allow to specify the same hull claim multiple times to allow fallback", () => {
    const ctx = buildCtx({
      incoming_user_claims: [
        {
          "hull": "email",
          "service": "first_place_to_look",
          "required": false
        },
        {
          "hull": "email",
          "service": "second_place_to_look",
          "required": false
        },
        {
          "hull": "email",
          "service": "third_place_to_look",
          "required": false
        }
      ]
    });
    const userClaims1 = incomingClaims(ctx)("user", {
      first_place_to_look: null,
      second_place_to_look: "found_in_second",
      third_place_to_look: "found_in_third"
    });
    expect(userClaims1).to.eql({
      claims: {
        email: "found_in_second",
      }
    });

    const userClaims2 = incomingClaims(ctx)("user", {
      first_place_to_look: null,
      second_place_to_look: "",
      third_place_to_look: "found_in_third"
    });
    expect(userClaims2).to.eql({
      claims: {
        email: "found_in_third",
      }
    });

    const userClaims3 = incomingClaims(ctx)("user", {
      first_place_to_look: null,
      second_place_to_look: "",
      third_place_to_look: undefined
    });
    expect(userClaims3).to.eql({
      error: "All configured fields for claims are empty: first_place_to_look, second_place_to_look, third_place_to_look"
    });
  });

  it("should allow to pass extra anonymous_id options", () => {
    const ctx = buildCtx({
      incoming_user_claims: [
        {
          "hull": "email",
          "service": "custom_email"
        }
      ]
    });
    const userClaims = incomingClaims(ctx)("user", {
      custom_email: "foo@bar.com",
      custom_anonymous_id: "anonymousIdValue"
    }, { anonymous_id_service: "custom_anonymous_id", anonymous_id_prefix: "customPrefix" });
    expect(userClaims).to.eql({
      claims: {
        anonymous_id: "customPrefix:anonymousIdValue",
        email: "foo@bar.com"
      }
    });

    // prefix is optional
    const userClaims1 = incomingClaims(ctx)("user", {
      custom_email: "foo@bar.com",
      custom_anonymous_id: "anonymousIdValue"
    }, { anonymous_id_service: "custom_anonymous_id" });
    expect(userClaims1).to.eql({
      claims: {
        anonymous_id: "anonymousIdValue",
        email: "foo@bar.com"
      }
    });

    // anonymous_id is only added if claims from configuration are present
    const userClaims2 = incomingClaims(ctx)("user", {
      custom_anonymous_id: "anonymousIdValue"
    }, { anonymous_id_service: "custom_anonymous_id" });
    expect(userClaims2).to.eql({
      error: "All configured fields for claims are empty: custom_email"
    });
  });
});
