const MappingUtil = require("../../server/lib/sync-agent/mapping-util");

const webhookPayload = require("../integration/fixtures/webhook-payloads/email-sent.json");

describe("MappingUtil", () => {
  test("should map a hull user with no account and no segments to the minimum customer.io customer object if nothing is configured", () => {
    const hullUser = {
      first_name: "Thomas",
      last_name: "Bass",
      email: "tb@hull.io",
      created_at: "2017-06-19T23:40:06Z",
      external_id: "hulltest123"
    };

    const util = new MappingUtil();

    const expected = {
      created_at: 1497915606,
      email: "tb@hull.io",
      hull_segments: [],
      id: "hulltest123"
    };

    const actual = util.mapToServiceUser(hullUser, []);

    expect(actual).toEqual(expected);
  });

  test("should map a hull user with an account and no segments to a customer.io customer object", () => {
    const userAttributeMappings = [
      "account.clearbit/name",
      "traits_salesforce_lead/title",
      "first_name",
      "last_name",
      "account.clearbit/geo_state"
    ];

    const hullUser = {
      account: {
        "clearbit/name": "Hull Inc",
        "clearbit/geo_state": "Georgia"
      },
      first_name: "Thomas",
      last_name: "Bass",
      email: "tb@hull.io",
      created_at: "2017-06-19T23:40:06Z",
      "traits_salesforce_lead/title": "Customer Success"
    };

    const util = new MappingUtil({ userAttributeMappings, userAttributeServiceId: "email" });

    const expected = {
      "account_clearbit-name": "Hull Inc",
      "salesforce_lead-title": "Customer Success",
      first_name: "Thomas",
      last_name: "Bass",
      "account_clearbit-geo_state": "Georgia",
      created_at: 1497915606,
      email: "tb@hull.io",
      hull_segments: [],
      id: "tb@hull.io"
    };

    const actual = util.mapToServiceUser(hullUser, []);

    expect(actual).toEqual(expected);
  });

  test("should map a hull user with an account and segments to a customer.io customer object", () => {
    const userAttributeMappings = [
      "account.clearbit/name",
      "traits_salesforce_lead/title",
      "first_name",
      "last_name",
      "account.clearbit/geo_state"
    ];

    const hullUser = {
      account: {
        "clearbit/name": "Hull Inc",
        "clearbit/geo_state": "Georgia"
      },
      first_name: "Thomas",
      last_name: "Bass",
      email: "tb@hull.io",
      created_at: "2017-06-19T23:40:06Z",
      "traits_salesforce_lead/title": "Customer Success"
    };

    const hullSegments = [
      {
        id: "59f09bc7f9c5a94af600076d",
        name: "Customer.io - Sync",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      },
      {
        id: "1daba83f64b242fda70b88d00f5e56bd",
        name: "Product Trials",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      }
    ];

    const util = new MappingUtil({ userAttributeMappings, userAttributeServiceId: "email" });

    const expected = {
      "account_clearbit-name": "Hull Inc",
      "salesforce_lead-title": "Customer Success",
      first_name: "Thomas",
      last_name: "Bass",
      "account_clearbit-geo_state": "Georgia",
      created_at: 1497915606,
      email: "tb@hull.io",
      hull_segments: ["Customer.io - Sync", "Product Trials"],
      id: "tb@hull.io"
    };

    const actual = util.mapToServiceUser(hullUser, hullSegments);

    expect(actual).toEqual(expected);
  });

  test("should map a hull user with an account and no segments to a customer.io customer object with hull_id in the mappings", () => {
    const userAttributeMappings = [
      "account.clearbit/name",
      "traits_salesforce_lead/title",
      "first_name",
      "last_name",
      "account.clearbit/geo_state",
      "id"
    ];

    const hullUser = {
      account: {
        "clearbit/name": "Hull Inc",
        "clearbit/geo_state": "Georgia"
      },
      first_name: "Thomas",
      last_name: "Bass",
      email: "tb@hull.io",
      created_at: "2017-06-19T23:40:06Z",
      "traits_salesforce_lead/title": "Customer Success",
      id: "123456"
    };

    const util = new MappingUtil({ userAttributeMappings, userAttributeServiceId: "email" });

    const expected = {
      "account_clearbit-name": "Hull Inc",
      "salesforce_lead-title": "Customer Success",
      first_name: "Thomas",
      last_name: "Bass",
      "account_clearbit-geo_state": "Georgia",
      created_at: 1497915606,
      email: "tb@hull.io",
      hull_segments: [],
      id: "tb@hull.io",
      hull_id: "123456"
    };

    const actual = util.mapToServiceUser(hullUser, []);

    expect(actual).toEqual(expected);
  });

  test("should map a hull event to a customer.io event", () => {
    const hullEvent = {
      track_id: "5a839571964619dfe2039927",
      user_id: "5a837fd9d8587b4fd40311ea",
      anonymous_id: "58a1ca4d-6cd7-468f-9823-c5af39f4f5cc",
      session_id: "58a1ca4d-6cd7-468f-9823-c5af39f4f5cc-2018-01-21",
      ship_id: null,
      app_id: "592e0e500b79ca51440017b1",
      app_name: "Segment",
      created_at: "2018-01-21T19:28:55Z",
      event_id: "a98b947e-f4f4-4bb1-a4a6-ea4b5402ef77",
      event: "Visited G2Crowd Page",
      properties: {
        at_time: "February 09, 2018 08:34 AM CST",
        country: "United States (US)",
        first_user_visited: "https://www.drift.com/",
        first_visit: "Your Site",
        industry: "unknown",
        organization: "unknown",
        then_user_visited: "/compare/drift-vs-intercom",
        time_between_events: "19 minutes"
      },
      event_source: "segment",
      event_type: "track",
      context: {
        browser: {
          name: "Other"
        },
        campaign: {
          name: null,
          source: null,
          medium: null,
          term: null,
          content: null
        },
        device: {
          name: "Other"
        },
        ip: "8.8.8.8",
        location: {
          city: "",
          country: "US",
          countryname: "United States",
          latitude: 37.751,
          longitude: -97.822,
          region: "",
          regionname: "",
          zipcode: "",
          timezone: ""
        },
        os: {
          name: "Other",
          version: ""
        },
        page: {
          url: "http://hull.io/",
          host: "hull.io",
          path: "/"
        },
        useragent: "Hull Node Client version: 1.1.5"
      }
    };

    const util = new MappingUtil();

    const actual = util.mapToServiceEvent(hullEvent);

    expect(actual).toEqual({ name: hullEvent.event, data: hullEvent.properties });
  });

  test("should map a webhook payload to hull ident object with id", () => {
    const userAttributeMappings = [
      "account.clearbit/name",
      "traits_salesforce_lead/title",
      "first_name",
      "last_name",
      "account.clearbit/geo_state"
    ];

    const opts = {
      userAttributeMappings,
      userAttributeServiceId: "id"
    };

    const util = new MappingUtil(opts);

    const expected = {
      email: "sven+dt2@hull.io",
      id: "5abc2de89ba6c1be560019e3"
    };

    const actual = util.mapWebhookToUserIdent(webhookPayload);

    expect(actual).toEqual(expected);
  });

  test("should map a webhook payload to hull ident object with external_id", () => {
    const userAttributeMappings = [
      "account.clearbit/name",
      "traits_salesforce_lead/title",
      "first_name",
      "last_name",
      "account.clearbit/geo_state"
    ];

    const opts = {
      userAttributeMappings,
      userAttributeServiceId: "external_id"
    };

    const util = new MappingUtil(opts);

    const expected = {
      email: "sven+dt2@hull.io",
      external_id: "5abc2de89ba6c1be560019e3"
    };

    const actual = util.mapWebhookToUserIdent(webhookPayload);

    expect(actual).toEqual(expected);
  });

  test("should map a webhook payload to a hull event object", () => {
    const userAttributeMappings = [
      "account.clearbit/name",
      "traits_salesforce_lead/title",
      "first_name",
      "last_name",
      "account.clearbit/geo_state"
    ];

    const opts = {
      userAttributeMappings,
      userAttributeServiceId: "id"
    };

    const util = new MappingUtil(opts);

    const expected = {
      context: {
        ip: "0"
      },
      event: "Email Sent",
      event_id: "01C9QJM259SPWQF2JZ8GX9HY7J",
      created_at: 1522283447,
      properties: {
        campaign_id: "12",
        campaign_name: "Started Vault Trials - 1 - Welcome, Installing and Deploying Vault",
        customer_id: "5abc2de89ba6c1be560019e3",
        email_address: "Sven <sven+dt2@hull.io>",
        email_id: "ZI6aBAABYm8p-RzGk9KlbP_MSBwc",
        email_subject: "How Vault Enterprise trials work",
        template_id: "35"
      }
    };

    const actual = util.mapWebhookToHullEvent(webhookPayload);

    expect(actual).toEqual(expected);
  });
});
