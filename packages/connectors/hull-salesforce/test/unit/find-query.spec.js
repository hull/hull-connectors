/* global describe, test, expect */
const QueryUtil = require("../../server/lib/sync-agent/query-util");
const expect = require("expect");

const queryUtil = new QueryUtil();

describe("composeFindQuery", () => {
  it("should create a valid query for leads", () => {
    const messages = [
      {
        user: {
          id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
          email: "betty.rich@solomonscastle.com",
          "traits_salesforce_lead/id": "0034600010mr05UAAQ"
        }
      },
      {
        user: {
          id: "53f0461a-71bb-4766-85cd-94aafe236659",
          email: "simon.perez@supratester.net",
          "traits_salesforce_lead/id": "0034700010mqTmRAAU"
        }
      },
      {
        user: {
          id: "d56679ca-f7e3-4918-a075-e844e9e430de",
          email: "tyler.strong@ultrachair.me"
        }
      }
    ];

    const query = queryUtil.composeFindQuery(messages, { Email: "email", Id: "traits_salesforce_lead/id" }, "user");
    const expected = {
      $or: [
        { Email: ["betty.rich@solomonscastle.com", "simon.perez@supratester.net", "tyler.strong@ultrachair.me"] },
        { Id: ["0034600010mr05UAAQ", "0034700010mqTmRAAU"] }
      ]
    };

    expect(query).toEqual(expected);
  });

  it("should create a valid query for contacts", () => {
    const messages = [
      {
        user: {
          id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
          email: "betty.rich@solomonscastle.com",
          "traits_salesforce_contact/id": "0034600010mr05UAAQ"
        }
      },
      {
        user: {
          id: "53f0461a-71bb-4766-85cd-94aafe236659",
          email: "simon.perez@supratester.net",
          "traits_salesforce_contact/id": "0034700010mqTmRAAU"
        }
      },
      {
        user: {
          id: "d56679ca-f7e3-4918-a075-e844e9e430de",
          email: "tyler.strong@ultrachair.me"
        }
      }
    ];

    const query = queryUtil.composeFindQuery(messages, { Email: "email", Id: "traits_salesforce_contact/id" }, "user");
    const expected = {
      $or: [
        { Email: ["betty.rich@solomonscastle.com", "simon.perez@supratester.net", "tyler.strong@ultrachair.me"] },
        { Id: ["0034600010mr05UAAQ", "0034700010mqTmRAAU"] }
      ]
    };

    expect(query).toEqual(expected);
  });

  it("should create an empty query if we don't have anything to query", () => {
    const messages = [{}, {}];
    const query = queryUtil.composeFindQuery(messages, { Website: "domain", Id: "salesforce/id" }, "account");
    const expected = {};
    expect(query).toEqual(expected);
  });

  it("should create a valid query for accounts via the user with websites", () => {
    const messages = [
      {
        user: {
          id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
          email: "betty.rich@solomonscastle.com",
          "traits_salesforce_contact/id": "0034600010mr05UAAQ"
        },
        account: {
          "salesforce/id": "0024600000WuQDsAAN",
          domain: "turboboost.com"
        }
      },
      {
        user: {
          id: "53f0461a-71bb-4766-85cd-94aafe236659",
          email: "simon.perez@supratester.net",
          "traits_salesforce_contact/id": "0034700010mqTmRAAU"
        },
        account: {
          "salesforce/id": "002460000AXuQDsAAN",
          domain: "downserve.com"
        }
      },
      {
        user: {
          id: "d56679ca-f7e3-4918-a075-e844e9e430de",
          email: "tyler.strong@ultrachair.me"
        },
        account: {}
      }
    ];

    const query = queryUtil.composeFindQuery(messages, { Website: "domain", Id: "salesforce/id" }, "account");
    const expected = {
      $or: [
        { Website: { $like: "%turboboost.com%" } },
        { Website: { $like: "%downserve.com%" } },
        { Id: ["0024600000WuQDsAAN", "002460000AXuQDsAAN"] }
      ]
    };
    expect(query).toEqual(expected);
  });

  it("should create a valid query for accounts with websites", () => {
    const messages = [
      {
        account: {
          "salesforce/id": "salesforceId1",
          domain: "turboboost.com"
        }
      },
      {
        account: {
          "salesforce/id": "salesforceId2",
          domain: "downserve.com"
        }
      },
      {
        account: {}
      }
    ];

    const query = queryUtil.composeFindQuery(messages, { Website: "domain", Id: "salesforce/id" }, "account");
    const expected = {
      $or: [
        { Website: { $like: "%turboboost.com%" } },
        { Website: { $like: "%downserve.com%" } },
        { Id: ["salesforceId1", "salesforceId2"] }
      ]
    };
    expect(query).toEqual(expected);
  });
});
