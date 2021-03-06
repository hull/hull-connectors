/* global describe, test */
const _ = require("lodash");
const moment = require("moment");
const EntityMessageFactory = require("./factories/entity-message");
const expect = require("expect");

const FilterUtil = require("../../server/lib/sync-agent/filter-util");
const {
  deduplicateMessages
} = require("../../server/lib/utils/dedupe-messages");

const smartNotifierPayload = require("../fixtures/smartnotifier_payloads/userupdate_noaccount.json");

describe("Filter Util Tests", function testSuite() {
  describe("Filter Account Tests", () => {
    it("should insert an account with short domain name", () => {
      const privateSettings = {
        allow_short_domains: true,
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
        account_synchronized_segments: ["b"]
      };

      const message = EntityMessageFactory.build(
        {},
        { withAccount: true, account_segments: ["b"] }
      );
      message.account.domain = "i.io";
      _.unset(message, "user");

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        { message, matches: { account: [], contact: [], lead: [] } }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert[0]).toHaveProperty("message");
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should insert an account via the user with short domain name", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
        allow_short_domains: true,
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
        ]
      };

      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      message.account.domain = "i.io";

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        { message, matches: { account: [], contact: [], lead: [] } }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert[0]).toHaveProperty("message");
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should not insert an account with short domain name", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
        allow_short_domains: false,
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
        ]
      };

      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      message.account.domain = "i.io";
      message.account.external_id = "1";

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        { message, matches: { account: [], contact: [], lead: [] }, skip: {} }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(0);
      expect(results.toSkip).toHaveLength(1);
      expect(results.toSkip[0].envelope.skip.account).toEqual(
        "The domain is too short to perform find on SFDC API, we tried exact match but didn't find any record"
      );
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should insert an account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true, account_segments: ["b"] }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        { message, matches: { account: [], contact: [], lead: [] } }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert[0]).toHaveProperty("message");
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should insert an account via the user", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        { message, matches: { account: [], contact: [], lead: [] } }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert[0]).toHaveProperty("message");
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should update an account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123", domain: "hull.io" }
        },
        { segments: ["a"], withAccount: true, account_segments: ["b"] }
      );
      _.unset(message, "user");

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [
              { Id: "123", Name: "Hull Test Inc.", Website: "hull.io" }
            ],
            contact: [],
            lead: []
          }
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toUpdate[0]).toEqual({
        message: {
          account: { id: "123", "salesforce/id": "123", domain: "hull.io" },
          segments: [{ id: "a", mame: "Name a" }],
          account_segments: [{ id: "b", mame: "Name b" }]
        },
        matches: {
          account: [{ Id: "123", Name: "Hull Test Inc.", Website: "hull.io" }],
          contact: [],
          lead: []
        }
      });
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip an account that does not have one of the required account claims", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123", domain: "hull.io" }
        },
        { segments: ["a"], withAccount: true, account_segments: ["b"] }
      );
      _.unset(message, "user");

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [
              { Id: "123", Name: "Hull Test Inc.", Website: "hull.io" }
            ],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.account).toEqual(
        "Missing required unique identifier in Hull."
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    // TODO need to revisit these cases:
    /*it("should update an account that has salesforce id and two required account claims but the second does not match", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        account_synchronized_segments: ["b"],
        lead_synchronized_segments: [],
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
      const message = EntityMessageFactory.build({
        account: { id: "123", "salesforce/id": "123", domain: "hull.io", external_id: "sfId-1" }
      }, { segments: ["a"], withAccount: true, account_segments: ["b"] });
      _.unset(message, "user");

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [{ Id: "123", Name: "Hull Test Inc.", Website: "hull.io", CustomIdentifierField__c: "adsf" }],
            contact: [],
            lead: []
          }
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toUpdate).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should insert an account that has two required account claims but the second does not match existing salesforce account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        account_synchronized_segments: ["b"],
        lead_synchronized_segments: [],
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
      const message = EntityMessageFactory.build({
        account: { id: "123", domain: "hull.io", external_id: "sfId-1" }
      }, { segments: ["a"], withAccount: true, account_segments: ["b"] });
      _.unset(message, "user");

      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [{ Id: "123", Name: "Hull Test Inc.", Website: "hull.io", CustomIdentifierField__c: "adsf" }],
            contact: [],
            lead: []
          }
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toSkip).toHaveLength(0);
    });*/

    it("should update an account with no required fields", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
        account_claims: [
          {
            hull: "domain",
            service: "Website"
          },
          {
            hull: "external_id",
            service: "CustomIdentifierField__c",
            required: false
          }
        ],
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123", domain: "hull.io" }
        },
        { withAccount: true, account_segments: ["b"] }
      );
      _.unset(message, "user");
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [
              { Id: "123", Name: "Hull Test Inc.", Website: "hull.io" }
            ],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toUpdate[0]).toHaveProperty("message");
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should update an account via the user", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123", domain: "hull.io" }
        },
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [
              { Id: "123", Name: "Hull Test Inc.", Website: "hull.io" }
            ],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toUpdate[0]).toHaveProperty("message");
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip an account if the configured unique id is not specified", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123" }
        },
        { account_segments: ["b"], withAccount: true }
      );
      _.unset(message, "user");

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const filterUtil = new FilterUtil(privateSettings);
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.account).toEqual(
        "Missing required unique identifier in Hull."
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip an account via the user if the configured unique id is not specified", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123" }
        },
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.account).toEqual(
        "Missing required unique identifier in Hull."
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip an account if the user doesn't have a hull account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip an account if the user doesn't belong to a contact segment", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip an account if the user belongs to a lead segment", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["b"],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should de-duplicate accounts and don't send them twice", () => {
      const privateSettings = {
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
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {},
        { account_segments: ["b"], withAccount: true }
      );
      _.unset(message, "user");
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        },
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          }
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should de-duplicate accounts via the user and don't send them twice", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        ]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        },
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should skip an account if the account is not in the filtered segments", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
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
        account_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123" }
        },
        { withAccount: true }
      );
      _.unset(message, "user");
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterAccountEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.account).toEqual(
        "doesn't match filter for accounts"
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });
  });

  describe("Filter Contact Tests", () => {
    it("should insert a contact with linked hull account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should filter deleted contact", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      _.set(message, "user.salesforce_contact/deleted_at", "1");
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.contact).toEqual(
        "Contact has been manually deleted in Salesforce."
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should filter contact without email", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
        ignore_users_withoutemail: true
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      _.unset(message, "user.email");
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.contact).toEqual(
        "User doesn't have an email address."
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should not update a potentially deleted contact", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_contact/id"] = "1234";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [
              { Id: "123", LastName: "Some Contact", Email: "test@hulltest.io" }
            ],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.contact).toEqual(
        "Contact has been potentially manually deleted in Salesforce."
      );
      expect(results.toInsert).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should insert a potentially deleted contact", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: [],
        ignore_deleted_objects: false
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_contact/id"] = "1234";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [
              { Id: "123", LastName: "Some Contact", Email: "test@hulltest.io" }
            ],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should insert a contact without linked hull account but linked sfdc account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_contact/account_id"] = "123";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should update a contact with linked hull account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123" }
        },
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_contact/id"] = "123";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [
              { Id: "123", LastName: "Some Contact", Email: "test@hulltest.io" }
            ],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toUpdate).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should update a contact without linked hull account", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_contact/id"] = "123";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [
              { Id: "123", LastName: "Some Contact", Email: "test@hulltest.io" }
            ],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toUpdate).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip a contact if the user doesn't belong to a contact segment", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: []
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);
      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip a contact if the user belongs to a lead segment", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["b"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterContactEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });
  });

  describe("Filter Lead Tests", () => {
    it("should insert a lead", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should filter deleted lead", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      _.set(message, "user.salesforce_lead/deleted_at", "1");
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should filter lead without email", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"],
        ignore_users_withoutemail: true
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: true }
      );
      _.unset(message, "user.email");
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should filter null segments", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = {
        user: { id: "1234", email: "asdf@gmail.com" },
        segments: [{ id: "a", name: "1234" }, null]
      };
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should update a lead", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_lead/id"] = "123";
      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: [
              { Id: "123", LastName: "Some Lead", Email: "test@hulltest.io" }
            ]
          },
          skip: {}
        }
      ];
      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toUpdate).toHaveLength(1);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should not update a potentially deleted lead", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_lead/id"] = "1234";
      const currentSfLead = {
        Id: "123",
        LastName: "Some Lead",
        Email: "test@hulltest.io"
      };

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.lead).toEqual(
        "Lead has been potentially manually deleted in Salesforce."
      );
      expect(results.toInsert).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should insert a potentially deleted lead", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"],
        ignore_deleted_objects: false
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_lead/id"] = "1234";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: [
              { Id: "123", LastName: "Some Lead", Email: "test@hulltest.io" }
            ]
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toInsert).toHaveLength(1);
      expect(results.toUpdate).toHaveLength(0);
    });

    it("should skip a lead if the user doesn't belong to a lead segment", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip).toHaveLength(0);
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip a lead if the user was synced as a contact before", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_contact/id"] = "123";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.lead).toEqual(
        "User was synced as a contact from SFDC before, cannot be in a lead segment. Please check your configuration"
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });

    it("should skip a lead if the user was has converted contact id trait", () => {
      const privateSettings = {
        contact_synchronized_segments: [],
        lead_synchronized_segments: ["a"]
      };
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      const filterUtil = new FilterUtil(privateSettings);
      message.user["salesforce_lead/converted_contact_id"] = "123";

      const envelopes = [
        {
          message,
          matches: {
            account: [],
            contact: [],
            lead: []
          },
          skip: {}
        }
      ];

      const results = filterUtil.filterLeadEnvelopes(envelopes);
      expect(results.toSkip[0].envelope.skip.lead).toEqual(
        "User was synced as a contact from SFDC before, cannot be in a lead segment. Please check your configuration"
      );
      expect(results.toUpdate).toHaveLength(0);
      expect(results.toInsert).toHaveLength(0);
    });
  });

  it("should consider a lead segment before a contact segment", () => {
    const privateSettings = {
      contact_synchronized_segments: ["a"],
      lead_synchronized_segments: ["a"]
    };
    const message = EntityMessageFactory.build(
      {},
      { segments: ["a"], withAccount: true }
    );
    const filterUtil = new FilterUtil(privateSettings);

    const envelopes = [
      { message, matches: { account: [], contact: [], lead: [] } }
    ];
    const accountResults = filterUtil.filterAccountEnvelopes(envelopes);
    expect(accountResults.toUpdate).toHaveLength(0);
    expect(accountResults.toInsert).toHaveLength(0);

    const contactResults = filterUtil.filterContactEnvelopes(envelopes);
    expect(contactResults.toUpdate).toHaveLength(0);
    expect(contactResults.toInsert).toHaveLength(0);

    const leadResults = filterUtil.filterLeadEnvelopes(envelopes);
    expect(leadResults.toInsert[0]).toHaveProperty("message");
    expect(leadResults.toUpdate).toHaveLength(0);
    expect(leadResults.toSkip).toHaveLength(0);
  });

  describe("filterDuplicateUserMessages", () => {
    it("should remove duplicate messages and pick only the latest", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["a"]
      };
      const filterUtil = new FilterUtil(privateSettings);

      const snsPayloadIn = _.cloneDeep(smartNotifierPayload);
      const msg2 = _.cloneDeep(snsPayloadIn.messages[0]);
      const timestamp2 = moment(_.get(msg2, "user.indexed_at", "")).subtract(
        3,
        "days"
      );
      _.set(msg2, "user.indexed_at", timestamp2.toISOString());
      _.set(msg2, "user.coconuts", 9);

      const deduped = deduplicateMessages(
        _.concat(snsPayloadIn.messages, msg2),
        "user"
      );
      expect(deduped).toEqual(smartNotifierPayload.messages);
    });

    it("should not remove any message if no duplicates", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["a"]
      };
      const filterUtil = new FilterUtil(privateSettings);

      const snsPayloadIn = _.cloneDeep(smartNotifierPayload);
      const msg2 = _.cloneDeep(snsPayloadIn.messages[0]);
      _.set(msg2, "user.id", "123456780789");
      snsPayloadIn.messages.push(msg2);

      const deduped = deduplicateMessages(snsPayloadIn.messages, "user");
      expect(deduped).toEqual(snsPayloadIn.messages);
    });

    it("should remove duplicate messages and pick only the latest per user", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["a"]
      };
      const filterUtil = new FilterUtil(privateSettings);

      const snsPayloadIn = _.cloneDeep(smartNotifierPayload);
      const msg2 = _.cloneDeep(snsPayloadIn.messages[0]);
      const timestamp2 = moment(_.get(msg2, "user.indexed_at", "")).subtract(
        3,
        "days"
      );
      _.set(msg2, "user.indexed_at", timestamp2.toISOString());
      _.set(msg2, "user.coconuts", 9);

      const msg3 = _.cloneDeep(snsPayloadIn.messages[0]);
      _.set(msg3, "user.id", "123456780789");
      snsPayloadIn.messages.push(msg3);

      const deduped = deduplicateMessages(
        _.concat(snsPayloadIn.messages, msg2),
        "user"
      );
      expect(deduped).toEqual(snsPayloadIn.messages);
    });

    it("should not throw an exception if invalid data is passed but return an empty array", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["a"]
      };
      const filterUtil = new FilterUtil(privateSettings);
      const deduped = deduplicateMessages({ foo: "baz" }, "user");
      expect(deduped).toEqual([]);
    });

    it("should not throw an exception if an empty array of messages is passed but return an empty array", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["a"]
      };
      const filterUtil = new FilterUtil(privateSettings);
      const deduped = deduplicateMessages([], "user");
      expect(deduped).toEqual([]);
    });
  });

  describe("Filter Messages", () => {
    it("should filter user without email", () => {
      const privateSettings = {
        contact_synchronized_segments: ["a"],
        lead_synchronized_segments: ["a"],
        ignore_users_withoutemail: true
      };
      const filterUtil = new FilterUtil(privateSettings);
      const message = EntityMessageFactory.build(
        {},
        { segments: ["a"], withAccount: false }
      );
      _.unset(message, "user.email");
      const filteredMessages = filterUtil.filterMessages("Contact", [message]);
      expect(filteredMessages).toHaveLength(0);
    });

    it("should filter an account. Belongs to segment. Do not send accounts without changes. There are no valid changes.", () => {
      const privateSettings = {
        account_synchronized_segments: ["accountSegment2", "accountSegment3"],
        ignore_users_withoutchanges: true,
        ignore_accounts_withoutchanges: true
      };

      const message = EntityMessageFactory.build(
        {
          changes: {
            account: { "salesforce/description": ["desc_1", "desc_2"] }
          },
          account: { id: "123", "salesforce/id": "123" }
        },
        { account_segments: ["accountSegment2"] }
      );

      const filterUtil = new FilterUtil(privateSettings);
      const filteredMessages = filterUtil.filterMessages("account", [message]);
      expect(filteredMessages).toHaveLength(0);
    });

    it("should not filter a batch sent account.", () => {
      const privateSettings = {
        account_synchronized_segments: ["accountSegment2", "accountSegment3"],
        ignore_users_withoutchanges: false,
        account_attributes_outbound: [
          {
            hull: "description",
            service: "Description",
            overwrite: true
          }
        ]
      };

      const message = EntityMessageFactory.build(
        {
          changes: {},
          account: { id: "123", "salesforce/id": "123" }
        },
        { account_segments: ["accountSegment4"] }
      );

      const filterUtil = new FilterUtil(privateSettings);
      const filteredMessages = filterUtil.filterMessages(
        "account",
        [message],
        true
      );
      expect(filteredMessages).toHaveLength(1);
    });

    it("should not filter a batch sent account with changes", () => {
      const privateSettings = {
        account_synchronized_segments: ["accountSegment2", "accountSegment3"],
        ignore_users_withoutchanges: true,
        account_attributes_outbound: [
          {
            hull: "description",
            service: "Description",
            overwrite: true
          }
        ]
      };

      const message = EntityMessageFactory.build(
        {
          changes: { account: { description: ["desc_1", "desc_2"] } },
          account: { id: "123", "salesforce/id": "123" }
        },
        { account_segments: ["accountSegment3"] }
      );

      const filterUtil = new FilterUtil(privateSettings);
      const filteredMessages = filterUtil.filterMessages(
        "account",
        [message],
        true
      );
      expect(filteredMessages).toHaveLength(1);
    });

    it("should not filter an account. Belongs to segment. Do not send accounts without changes. There are valid changes.", () => {
      const privateSettings = {
        account_synchronized_segments: ["accountSegment2", "accountSegment3"],
        ignore_users_withoutchanges: true,
        ignore_accounts_withoutchanges: false,
        account_attributes_outbound: [
          {
            hull: "description",
            service: "Description",
            overwrite: true
          }
        ]
      };

      const message = EntityMessageFactory.build(
        {
          changes: { account: { description: ["desc_1", "desc_2"] } },
          account: { id: "123", "salesforce/id": "123" }
        },
        { account_segments: ["accountSegment2"] }
      );

      const filterUtil = new FilterUtil(privateSettings);
      const filteredMessages = filterUtil.filterMessages("account", [message]);
      expect(filteredMessages).toHaveLength(1);
    });

    it("should not filter an account. Belongs to segment. Send accounts regardless of changes", () => {
      const privateSettings = {
        account_synchronized_segments: ["accountSegment2", "accountSegment3"],
        ignore_users_withoutchanges: false
      };

      const message = EntityMessageFactory.build(
        {
          account: { id: "123", "salesforce/id": "123" }
        },
        { account_segments: ["accountSegment2"] }
      );

      const filterUtil = new FilterUtil(privateSettings);
      const filteredMessages = filterUtil.filterMessages("account", [message]);
      expect(filteredMessages).toHaveLength(1);
    });

    it("should filter users that do belong to one list of whitelisted segments but has no changes, if no batch", () => {
      const privateSettings = {
        contact_synchronized_segments: ["b"],
        lead_synchronized_segments: ["a"],
        ignore_users_withoutchanges: true
      };
      const filterUtil = new FilterUtil(privateSettings);
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: false }
      );
      _.set(message, "changes.user", {});
      const filteredMessages = filterUtil.filterMessages("contact", [message]);
      expect(filteredMessages).toHaveLength(0);
    });

    it("should filter users that do belong to one list of whitelisted segments and has no targeted changes, if no batch", () => {
      const privateSettings = {
        contact_synchronized_segments: ["b"],
        lead_synchronized_segments: ["a"],
        ignore_users_withoutchanges: true,
        contact_attributes_outbound: [
          {
            hull: "email",
            service: "Email",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: true
          }
        ]
      };
      const filterUtil = new FilterUtil(privateSettings);
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: false }
      );
      _.set(message, "changes.user", { first_name: [null, "John"] });
      const filteredMessages = filterUtil.filterMessages("Contact", [message]);
      expect(filteredMessages).toHaveLength(0);
    });

    it("should not filter users that do belong to one list of whitelisted segments and has targeted array changes, if no batch", () => {
      const privateSettings = {
        contact_synchronized_segments: ["b"],
        lead_synchronized_segments: ["a"],
        ignore_users_withoutchanges: true,
        contact_attributes_outbound: [
          {
            hull: "email",
            service: "Email",
            overwrite: false
          },
          {
            hull: "unified_data/somearray",
            service: "apicklist",
            overwrite: true
          }
        ]
      };
      const filterUtil = new FilterUtil(privateSettings);
      const message = EntityMessageFactory.build(
        {},
        { segments: ["b"], withAccount: false }
      );
      _.set(message, "changes.user", {
        "unified_data/somearray[0]": ["John1", "Tim"],
        "traits_unified_data/somearray[1]": ["Eric1", "Eric2"]
      });
      const filteredMessages = filterUtil.filterMessages("Contact", [message]);
      expect(filteredMessages).toHaveLength(1);
    });
  });
});
