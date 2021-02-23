/* @flow */

const IdentityUtil = require("../../server/lib/utils/identity-utils");
const SalesforceAccountFactory = require("./factories/salesforce-account");
const { ContextMock } = require("../helper/connector-mock");
const connector = require("./mocks/connector");
const expect = require("expect");

describe("Identity Utils Test", () => {
  it("Should return correct account identity", () => {
    const ctxMock = new ContextMock();
    ctxMock.connector = connector;
    ctxMock.ship = connector;

    const resource = "Account";
    const sfAccount = SalesforceAccountFactory.build(
      {},
      {
        Website: "domain1.com",
        Id: "0011I000007Cy18QAC",
        CustomIdentifierField__c: "0011I000007Cy18QAC"
      }
    );
    const account = {
      domain: "krakowtraders.pl",
      id: "accountId1",
      external_id: "0011I000007Cy18QAC"
    };

    const accountIdentity = IdentityUtil.getEntityIdentity({
      hullEntity: account,
      sfEntity: sfAccount,
      resource,
      hullClient: ctxMock.client,
      source: "salesforce"
    });

    expect(accountIdentity).toEqual({
      id: "accountId1",
      domain: "krakowtraders.pl",
      external_id: "0011I000007Cy18QAC",
      anonymous_id: "salesforce:0011I000007Cy18QAC"
    });
  });

  it("Should return correct account identity and log extra anon ids", () => {
    const ctxMock = new ContextMock();
    ctxMock.connector = connector;
    ctxMock.ship = connector;

    const resource = "Account";
    const sfAccount = SalesforceAccountFactory.build(
      {},
      {
        Website: "domain1.com",
        Id: "0011I000007Cy18QAC",
        CustomIdentifierField__c: "0011I000007Cy18QAC"
      }
    );

    const account = {
      domain: "krakowtraders.pl",
      id: "accountId1",
      external_id: "0011I000007Cy18QAC",
      anonymous_ids: ["salesforce:RANDOM_ID1", "salesforce:RANDOM_ID2"]
    };

    const accountIdentity = IdentityUtil.getEntityIdentity({
      hullEntity: account,
      sfEntity: sfAccount,
      resource,
      hullClient: ctxMock.client,
      source: "salesforce"
    });
    expect(accountIdentity).toEqual({
      anonymous_id: "salesforce:0011I000007Cy18QAC",
      anonymous_ids: ["salesforce:RANDOM_ID1", "salesforce:RANDOM_ID2"],
      domain: "krakowtraders.pl",
      external_id: "0011I000007Cy18QAC",
      id: "accountId1"
    });
  });

  it("Should return correct user identity and logg extra anon ids", () => {
    const ctxMock = new ContextMock();
    ctxMock.connector = connector;
    ctxMock.ship = connector;

    const resource = "Contact";
    const sfAccount = SalesforceAccountFactory.build(
      {},
      {
        FirstName: "Adam",
        LastName: "Pietrzyk",
        Email: "adam.pietrzyk@krakowtraders.pl",
        AccountId: "0011I000007Cy18QAC",
        Id: "00Q1I000004WO7uUAG"
      }
    );

    const user = {
      anonymous_ids: ["salesforce-contact:RANDOM_ID1"],
      domain: "krakowtraders.pl",
      email: "adam.pietrzyk@krakowtraders.pl",
      first_name: "Adam",
      id: "5a43ce781f6d9f471d005d44",
      last_name: "Pietrzyk",
      name: "Adam Pietrzyk",
      "traits_salesforce_contact/account_id": "0011I000007Cy18QAC"
    };

    const accountIdentity = IdentityUtil.getEntityIdentity({
      hullEntity: user,
      sfEntity: sfAccount,
      resource,
      hullClient: ctxMock.client,
      source: "salesforce"
    });

    expect(accountIdentity).toEqual({
      anonymous_id: "salesforce-contact:00Q1I000004WO7uUAG",
      anonymous_ids: ["salesforce-contact:RANDOM_ID1"],
      email: "adam.pietrzyk@krakowtraders.pl",
      id: "5a43ce781f6d9f471d005d44"
    });
  });

  it("Should return correct user identity", () => {
    const ctxMock = new ContextMock();
    ctxMock.connector = connector;
    ctxMock.ship = connector;

    const resource = "Contact";
    const sfAccount = SalesforceAccountFactory.build(
      {},
      {
        FirstName: "Adam",
        LastName: "Pietrzyk",
        Email: "adam.pietrzyk@krakowtraders.pl",
        AccountId: "0011I000007Cy18QAC",
        Id: "00Q1I000004WO7uUAG"
      }
    );

    const user = {
      anonymous_ids: [],
      domain: "krakowtraders.pl",
      email: "adam.pietrzyk@krakowtraders.pl",
      first_name: "Adam",
      id: "5a43ce781f6d9f471d005d44",
      last_name: "Pietrzyk",
      name: "Adam Pietrzyk",
      "traits_salesforce_contact/account_id": "0011I000007Cy18QAC"
    };

    const accountIdentity = IdentityUtil.getEntityIdentity({
      hullEntity: user,
      sfEntity: sfAccount,
      resource,
      hullClient: ctxMock.client,
      source: "salesforce"
    });

    expect(accountIdentity).toEqual({
      anonymous_id: "salesforce-contact:00Q1I000004WO7uUAG",
      anonymous_ids: [],
      email: "adam.pietrzyk@krakowtraders.pl",
      id: "5a43ce781f6d9f471d005d44"
    });
  });
});
