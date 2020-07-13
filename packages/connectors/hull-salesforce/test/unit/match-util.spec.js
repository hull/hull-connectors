/* global describe, test, expect */
import type { IAccountUpdateEnvelope } from "../../server/lib/types";
import type { THullAccountUpdateMessage } from "hull/lib";

const MatchUtil = require("../../server/lib/sync-agent/match-util");
const HullAccountFactory = require("./factories/hull-account");
const SalesforceAccountFactory = require("./factories/salesforce-account");
const EntityMessageFactory = require("./factories/entity-message");
const _ = require("lodash");
const expect = require("expect");

const matchUtil = new MatchUtil();

const domainTestCases = [
  { website: "", domain: "" },
  { website: undefined, domain: "" },
  { website: null, domain: "" },
  { website: "hull.io", domain: "hull.io" },
  { website: "www.hull.io", domain: "hull.io" },
  { website: "http://www.hull.io", domain: "hull.io" },
  { website: "https://www.hull.io", domain: "hull.io" },
  { website: "https://hull.io/boom", domain: "hull.io" },
  { website: "https://www.hull.io/bam", domain: "hull.io" },
  { website: "https://bim.hull.io", domain: "bim.hull.io" },
  { website: "http://hull.io/", domain: "hull.io" },
  { website: "http://hull.io/index.html?what=thefuck", domain: "hull.io" },
  { website: "hull.io/i/would/say/yes", domain: "hull.io" },
  { website: "/hull.io", domain: "" },
  { website: "boom", domain: "" },
  { website: "hullio", domain: "" },
  { website: "ftp://hull.io", domain: "hull.io" },
  { website: "ilovehull.io", domain: "ilovehull.io" },
  { website: "i-hate-hull.io", domain: "i-hate-hull.io" },
  { website: "www.hull.io/\\", domain: "hull.io" },
  { website: "www.safervpn.com/business", domain: "safervpn.com" }
];

describe("Extract Matching Domain Tests", () => {
  domainTestCases.forEach((tc) => {
    it(`should extract the matching domain '${tc.domain}' from website '${tc.website}'`, () => {
      const actual = matchUtil.extractMatchingDomain(tc.website);

      expect(actual).toBe(tc.domain);
    });
  });
});

describe("Should Match Accounts", () => {

  let privateSettings = {
    account_claims: [
      {
        hull: "domain",
        service: "Website",
        required: true
      },
      {
        hull: "external_id",
        service: "CustomIdentifierField__c",
        required: true
      }
    ],
  };
  let accountClaims = _.get(privateSettings, "account_claims");

  it("2 matches for required domain account claim. 1 overlapping match for required ext id account claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "https://domain1.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "www.domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);

    const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(accountMatches).toEqual(
      {
        "primary": [],
        "secondary": [
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          }
        ]
      }
    );
  });

  it("2 matches for required domain account claim. 0 matches for required ext id account claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: false
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "domain1.com", external_id: "non-matching-sf-id", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);

    const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(accountMatches).toEqual(
      {
        "primary": [],
        "secondary": [
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          },
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-2",
            "CustomIdentifierField__c": "salesforceAccountId-2"
          }
        ]
      }
    );
  });

  it("2 matches for required domain account claim. 1 match for non required ext id account claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c"
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "https://domain1.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "http://domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "www.domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);

    const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(accountMatches).toEqual(
      {
        "primary": [],
        "secondary": [
          {
            "Website": "http://domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          }
        ]
      }
    );
  });

  it("0 matches for required domain account claim. 1 match for required ext id account claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        },
        {
          hull: "domain",
          service: "Website",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "non-matching-domain.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);

    const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(accountMatches).toEqual({
      "primary": [],
      "secondary": [
        {
          "Website": "domain1.com",
          "Id": "salesforceAccountId-1",
          "CustomIdentifierField__c": "salesforceAccountId-1"
        }
      ]
    });
  });

  it("2 matches for domain account claim. 1 non-overlapping match for required ext id account claim", () => {
    // TODO: not a possible case
    expect(true).toBe(true);
  });


  it("0 matches for non required domain account claim. 1 match for required ext id account claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: false
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "non-matching-domain.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);

    const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(accountMatches).toEqual({
      "primary": [],
      "secondary": [
        {
          "Website": "domain1.com",
          "Id": "salesforceAccountId-1",
          "CustomIdentifierField__c": "salesforceAccountId-1"
        }
      ]
    });
  });

  it("2 Messages - should find salesforce accounts", () => {
    // 2 Messages
    // -> both messages have two top required domain account claim matches and 1 external_id account claim match
    // -> results in one salesforce account per message

    privateSettings = {
      account_claims: [
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        },
        {
          hull: "domain",
          service: "Website",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const messages = [];
    const salesForceAccounts = [];

    const accountMessage0 = EntityMessageFactory.build({
      account: { domain: "domain1.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});
    const accountMessage1 = EntityMessageFactory.build({
      account: { domain: "domain2.com", external_id: "salesforceAccountId-4", id: "accountId-2" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });
    const sfAccount3 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-4", CustomIdentifierField__c: "salesforceAccountId-4" });
    const sfAccount4 = SalesforceAccountFactory.build({}, { Website: "domain3.com", Id: "salesforceAccountId-5", CustomIdentifierField__c: "salesforceAccountId-5" });
    const sfAccount5 = SalesforceAccountFactory.build({}, { Website: "domain3.com", Id: "salesforceAccountId-5", CustomIdentifierField__c: "salesforceAccountId-1" });

    salesForceAccounts.push(sfAccount2);
    salesForceAccounts.push(sfAccount3);
    salesForceAccounts.push(sfAccount4);
    salesForceAccounts.push(sfAccount5);
    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);

    messages.push(accountMessage0);
    messages.push(accountMessage1);

    const matches = [];
    _.forEach(messages, message => {
      const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);
      matches.push(accountMatches);
    })
    expect(matches).toEqual(
      [
        {
          "primary": [],
          "secondary": [
            {
              "Website": "domain1.com",
              "Id": "salesforceAccountId-1",
              "CustomIdentifierField__c": "salesforceAccountId-1"
            }
          ]
        },
        {
          "primary": [],
          "secondary": [
            {
              "Website": "domain2.com",
              "Id": "salesforceAccountId-4",
              "CustomIdentifierField__c": "salesforceAccountId-4"
            }
          ]
        }
      ]
    );
  });

  it("2 Messages - first message finds sf account", () => {
    // 2 Messages
    // -> first message has two required account claim matches and 1 required account claim match
    // -> second message has two required account claim matches and 0 required account claim matches
    // -> results in one salesforce account that matched the first message

    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const messages = [];
    const salesForceAccounts = [];

    const accountMessage0 = EntityMessageFactory.build({
      account: { domain: "domain1.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});
    const accountMessage1 = EntityMessageFactory.build({
      account: { domain: "domain2.com", external_id: "randomSF-Id", id: "accountId-2" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });
    const sfAccount3 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-4", CustomIdentifierField__c: "salesforceAccountId-4" });
    const sfAccount4 = SalesforceAccountFactory.build({}, { Website: "domain3.com", Id: "salesforceAccountId-5", CustomIdentifierField__c: "salesforceAccountId-5" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);
    salesForceAccounts.push(sfAccount3);
    salesForceAccounts.push(sfAccount4);
    messages.push(accountMessage0);
    messages.push(accountMessage1);

    const matches = [];
    _.forEach(messages, message => {
      const accountMatches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);
      matches.push(accountMatches);
    })
    expect(matches).toEqual(
      [
        {
          "primary": [],
          "secondary": [
            {
              "Website": "domain1.com",
              "Id": "salesforceAccountId-1",
              "CustomIdentifierField__c": "salesforceAccountId-1"
            }
          ]
        },
        {
          "primary": [],
          "secondary": [
            {
              "Website": "domain2.com",
              "Id": "salesforceAccountId-3",
              "CustomIdentifierField__c": "salesforceAccountId-3"
            },
            {
              "Website": "domain2.com",
              "Id": "salesforceAccountId-4",
              "CustomIdentifierField__c": "salesforceAccountId-4"
            }
          ]
        }
      ]
    );
  });

  it("Single match for required claim. No matches for non required claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: false
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "non-matching-domain.com", external_id: "salesforceAccountId-1", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });
    const sfAccount3 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-4", CustomIdentifierField__c: "salesforceAccountId-4" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);
    salesForceAccounts.push(sfAccount3);

    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(matches).toEqual(
      {
        "primary": [],
        "secondary": [
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          }
        ]
      }
    );
  });

  it("no account claim matches", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "non-matching-domain.com", external_id: "non-matching-id", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-3", CustomIdentifierField__c: "salesforceAccountId-3" });
    const sfAccount3 = SalesforceAccountFactory.build({}, { Website: "domain2.com", Id: "salesforceAccountId-4", CustomIdentifierField__c: "salesforceAccountId-4" });
    const sfAccount4 = SalesforceAccountFactory.build({}, { Website: "domain3.com", Id: "salesforceAccountId-5", CustomIdentifierField__c: "salesforceAccountId-5" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);
    salesForceAccounts.push(sfAccount3);
    salesForceAccounts.push(sfAccount4);

    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(matches).toEqual(
      {
        "primary": [],
        "secondary": []
      }
    );
  });

  it("2 top domain required account claim matches. 0 external_id required account claim matches.", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c",
          required: true
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "domain1.com", external_id: "salesforceAccountId-5", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-2", CustomIdentifierField__c: "salesforceAccountId-2" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(matches).toEqual(
      {
        "primary": [],
        "secondary": [
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          },
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-2",
            "CustomIdentifierField__c": "salesforceAccountId-2"
          }
        ]
      }
    );
  });

  it("2 matches for required domain account claim. 2 matches for non required ext id account claim", () => {
    privateSettings = {
      account_claims: [
        {
          hull: "domain",
          service: "Website",
          required: true
        },
        {
          hull: "external_id",
          service: "CustomIdentifierField__c"
        }
      ],
    };
    accountClaims = _.get(privateSettings, "account_claims");

    const salesForceAccounts = [];

    const message = EntityMessageFactory.build({
      account: { domain: "domain1.com", external_id: "salesforceAccountId-5", id: "accountId-1" }
    }, {});

    const sfAccount0 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount1 = SalesforceAccountFactory.build({}, { Website: "domain1.com", Id: "salesforceAccountId-1", CustomIdentifierField__c: "salesforceAccountId-1" });
    const sfAccount2 = SalesforceAccountFactory.build({}, { Website: "domain3.com", Id: "salesforceAccountId-5", CustomIdentifierField__c: "salesforceAccountId-5" });
    const sfAccount3 = SalesforceAccountFactory.build({}, { Website: "domain4.com", Id: "salesforceAccountId-5", CustomIdentifierField__c: "salesforceAccountId-5" });

    salesForceAccounts.push(sfAccount0);
    salesForceAccounts.push(sfAccount1);
    salesForceAccounts.push(sfAccount2);
    salesForceAccounts.push(sfAccount3);
    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, salesForceAccounts, accountClaims);

    expect(matches).toEqual(
      {
        "primary": [],
        "secondary": [
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          },
          {
            "Website": "domain1.com",
            "Id": "salesforceAccountId-1",
            "CustomIdentifierField__c": "salesforceAccountId-1"
          }
        ]
      }
    );
  });

  it("should error out when there are no accounts to match", () => {
    const message = {
      user: {
        id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
        email: "betty.rich@solomonscastle.com",
        "salesforce_lead/id": "0034600010mr05UAAQ"
      }
    };

    const sfAccounts = [
      {
        Id: "0012F00000BPjT7QAL",
        Website: "UppercaseInc.com",
        Name: "Uppercase Inc."
      },
      {
        Id: "0011GA0000BQjT1QHA",
        Website: "http://goldminingco.com",
        Name: "Gold Mining Corp."
      }
    ];

    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, sfAccounts, accountClaims);

    expect(matches).toEqual({
      "primary": [],
      "secondary": []
    });
  });

  it("should match an account by domain/Website with only a single secondary match", () => {
    const message = {
      account: {
        id: "a3136f61-ac4f-4ae2-ab13-43eaf4f4ac34",
        domain: "goldminingco.com",
        Name: "Gold Mining"
      },
      user: {
        id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
        email: "lotta.sweet@goldminingco.com",
        "salesforce_contact/id": "0034600010mr05UAAQ"
      }
    };

    const sfAccounts = [
      {
        Id: "0012F00000BPjT7QAL",
        Website: "UppercaseInc.com",
        Name: "Uppercase Inc."
      },
      {
        Id: "0011GA0000BQjT1FOO",
        Website: "http://ilovegoldminingco.com",
        Name: "Gold Mining Fanclub"
      },
      {
        Id: "0013GA0000AQdT1FOO",
        Website: "http://mygoldminingco.com",
        Name: "Gold Mining Corp. VIP Sales"
      },
      {
        Id: "0011GA0000BQjT1QHA",
        Website: "http://goldminingco.com",
        Name: "Gold Mining Corp."
      }
    ];

    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, sfAccounts, accountClaims);

    expect(matches).toEqual({
      "primary": [],
      "secondary": [
        {
          "Id": "0011GA0000BQjT1QHA",
          "Website": "http://goldminingco.com",
          "Name": "Gold Mining Corp."
        }
      ]
    });
  });

  it("should match an account by salesforce Id", () => {
    const message = {
      account: {
        id: "a3136f61-ac4f-4ae2-ab13-43eaf4f4ac34",
        domain: "goldminingco.shop",
        Name: "Gold Mining",
        "salesforce/id": "0011GA0000BQjT1QHA"
      },
      user: {
        id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
        email: "lotta.sweet@goldminingco.com",
        "salesforce_contact/id": "0034600010mr05UAAQ"
      }
    };

    const sfAccounts = [
      {
        Id: "0012F00000BPjT7QAL",
        Website: "UppercaseInc.com",
        Name: "Uppercase Inc."
      },
      {
        Id: "0021ZK0000BQjT1BUM",
        Website: "http://goldminingco.shop",
        Name: "Gold Mining Corp. Online Shop"
      },
      {
        Id: "0011GA0000BQjT1QHA",
        Website: "http://goldminingco.com",
        Name: "Gold Mining Corp."
      }
    ];

    const matches = matchUtil.matchHullMessageToSalesforceAccount(message, sfAccounts, accountClaims);

    expect(matches).toEqual({
      "primary": [
        {
          "Id": "0011GA0000BQjT1QHA",
          "Website": "http://goldminingco.com",
          "Name": "Gold Mining Corp."
        }
      ],
      "secondary": []
    });
  });
});

describe("Match Users Tests", () => {
  it("should throw an error if unsupported resource type is passed", () => {
    const user = {};
    const sfObjects = [];
    expect(() => { matchUtil.matchHullMessageToSalesforceEntity("Opportunity", user, sfObjects); }).toThrowError("Unsupported resource type. Only Contact and Lead can be matched to an user.");
  });

  it("should not match with a salesforce contact", () => {
    const user = {
      id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
      email: "betty.rich@solomonscastle.com",
      "salesforce_lead/id": "0034600010mr05UAAQ"
    };

    const sfContacts = [
      {
        Id: "0012F00000BPjT7QAL",
        Email: "jim.witheward@beardshop.com.au"
      },
      {
        Id: "0011GA0000BQjT1QHA",
        Email: "carolin.brown@awxnutrition.us"
      }
    ];

    const matches = matchUtil.matchHullMessageToSalesforceEntity("Contact", user, sfContacts);

    expect(matches).toEqual([]);
  });

  it("should find a matching contact", () => {
    const user = {
      id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
      email: "betty.rich@solomonscastle.com",
      "salesforce_lead/id": "0034600010mr05UAAQ"
    };

    const sfContacts = [
      {
        Id: "0012F00000BPjT7QAL",
        Email: "jim.witheward@beardshop.com.au"
      },
      {
        Id: "0011GA0000BQjT1QHA",
        Email: "betty.rich@solomonscastle.com"
      }
    ];

    const matches = matchUtil.matchHullMessageToSalesforceEntity("Contact", user, sfContacts);

    expect(matches).toEqual([{
      Id: "0011GA0000BQjT1QHA",
      Email: "betty.rich@solomonscastle.com"
    }]);
  });

  it("should find a matching contact by Id", () => {
    const user = {
      id: "872594a6-1d60-45f8-a73c-678dbd25e4c1",
      email: "betty.rich@solomonscastle.com",
      "salesforce_contact/id": "0034600010mr05UAAQ"
    };

    const sfContacts = [
      {
        Id: "0012F00000BPjT7QAL",
        Email: "jim.witheward@beardshop.com.au"
      },
      {
        Id: "0011GA0000BQjT1QHA",
        Email: "betty.rich@solomonscastle.com"
      },
      {
        Id: "0034600010mr05UAAQ",
        Email: "betty.rich@solomonscastle.de"
      }
    ];

    const matches = matchUtil.matchHullMessageToSalesforceEntity("Contact", user, sfContacts);

    expect(matches).toEqual([{
      Id: "0034600010mr05UAAQ",
      Email: "betty.rich@solomonscastle.de"
    }]);
  });
});

describe("Filter Identity Claim Matches", () => {
  it("should find a single salesforce account match from identity claims and intersecting by external id", () => {
    const accountClaims = [
      { "hull": "domain", "service": "Website", "required": true },
      { "hull": "external_id", "service": "CustomIdentifierField__c", "required": true }
    ];
    const identityClaimMatches = {
      "external_id": [
        { "Website": "domain3.com", "CustomIdentifierField__c": "salesforceAccountId-1" },
        { "Website": "domain1.com", "CustomIdentifierField__c": "salesforceAccountId-1" }
      ],
      "domain": [
        { "Website": "domain1.com", "CustomIdentifierField__c": "salesforceAccountId-1" },
        { "Website": "domain1.com", "CustomIdentifierField__c": "salesforceAccountId-2" }
      ]
    };
    const matches = matchUtil.filterIdentityClaimMatches({
      identityClaims: accountClaims,
      identityClaimMatches,
      intersectBy: { path: "service", resolve: true }
    });
    expect(matches).toEqual([{
      "Website": "domain1.com",
      "CustomIdentifierField__c": "salesforceAccountId-1"
    }]);
  });

  it("should find a single salesforce account match from identity claims and intersecting by domain", () => {
    const accountClaims = [
      { "hull": "external_id", "service": "CustomIdentifierField__c", "required": true },
      { "hull": "domain", "service": "Website", "required": true }
    ];
    const identityClaimMatches = {
      "external_id": [
        { "Website": "domain3.com", "CustomIdentifierField__c": "salesforceAccountId-1" },
        { "Website": "domain1.com", "CustomIdentifierField__c": "salesforceAccountId-1" }
      ],
      "domain": [
        { "Website": "domain1.com", "CustomIdentifierField__c": "salesforceAccountId-1" },
        { "Website": "domain1.com", "CustomIdentifierField__c": "salesforceAccountId-2" }
      ]
    };
    const matches = matchUtil.filterIdentityClaimMatches({
      identityClaims: accountClaims,
      identityClaimMatches,
      intersectBy: { path: "service", resolve: true }
    });
    expect(matches).toEqual([{
      "Website": "domain1.com",
      "CustomIdentifierField__c": "salesforceAccountId-1"
    }]);
  });
});
