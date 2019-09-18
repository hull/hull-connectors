const _ = require("lodash");

const MappingUtil = require("../../server/lib/sync-agent/mapping-util");

const { ACCOUNT_MAPPING, PERSON_MAPPING } = require("../../server/lib/sync-agent/clearbit-mappings");

describe("MappingUtil", () => {
  let util;

  const hullUser = {
    accepts_marketing: false,
    anonymous_ids: [
      "58a1ca4d-6cd7-468f-9823-c5af39f4f5cc"
    ],
    created_at: "2018-02-14T00:16:25Z",
    domain: "hullunittest.io",
    email: "lydia@hullunittest.io",
    first_name: "Lydia",
    first_seen_at: "2018-01-07T19:28:55Z",
    first_session_initial_referrer: "",
    first_session_initial_url: "http://hull.io/testhull/",
    first_session_platform_id: "592e0e500b79ca51440017b1",
    first_session_started_at: "2018-01-07T19:28:55Z",
    has_password: false,
    id: "5a837fd9d8587b4fd40311ea",
    is_approved: false,
    last_known_ip: "8.8.8.8",
    last_name: "Smith",
    last_seen_at: "2018-01-17T19:28:55Z",
    latest_session_initial_referrer: "",
    latest_session_initial_url: "http://hull.io/signup/",
    latest_session_platform_id: "592e0e500b79ca51440017b1",
    latest_session_started_at: "2018-01-17T19:28:55Z",
    name: "Lydia Smith",
    segment_ids: [
      "59f09bc7f9c5a94af600076d"
    ],
    signup_session_initial_referrer: "",
    signup_session_initial_url: "http://drift.com/testhull/",
    signup_session_platform_id: "592e0e500b79ca51440017b1",
    signup_session_started_at: "2018-01-07T19:28:55Z",
    traits_hull: "identify",
    indexed_at: "2018-02-14T01:49:17+00:00"
  };

  const hullAccount = {
    "attribution/last_lead_source": "CQL",
    "attribution/last_lead_source_detail": "http://hull.io/signup/",
    "attribution/last_lead_source_timestamp": "2018-02-13T19:28:55Z",
    "clearbit/category_industry": "Professional Services",
    "clearbit/category_industry_group": "Commercial & Professional Services",
    "clearbit/category_naics_code": "54",
    "clearbit/category_sector": "Industrials",
    "clearbit/category_sic_code": "73",
    "clearbit/category_sub_industry": "Consulting",
    "clearbit/description": "We are the premier fitness brand for all fitness levels.",
    "clearbit/domain": "stayfit123.com",
    "clearbit/domain_aliases": [
      "stayfit123.nl"
    ],
    "clearbit/email_provider": false,
    "clearbit/facebook_handle": "stayfit123",
    "clearbit/geo_city": "Eindhoven",
    "clearbit/geo_country": "Netherlands",
    "clearbit/geo_country_code": "NL",
    "clearbit/geo_lat": 51.4719807,
    "clearbit/geo_lng": 5.4450888,
    "clearbit/geo_postal_code": "5624 CL",
    "clearbit/geo_state": "Noord-Brabant",
    "clearbit/geo_state_code": "NB",
    "clearbit/geo_street_name": "Boschdijk",
    "clearbit/geo_street_number": "888",
    "clearbit/id": "some12345678id",
    "clearbit/linkedin_handle": "company/stayfit123",
    "clearbit/location": "Boschdijk 888, 5624 CL Eindhoven, Netherlands",
    "clearbit/logo": "https://logo.clearbit.com/stayfit123.com",
    "clearbit/metrics_alexa_global_rank": 999999,
    "clearbit/metrics_employees": 30,
    "clearbit/metrics_employees_range": "11-50",
    "clearbit/metrics_estimated_annual_revenue": "$1M-$10M",
    "clearbit/name": "Stayfit 123",
    "clearbit/prospected_at": "2018-03-20T02:23:54Z",
    "clearbit/prospected_from": "someuserid8978",
    "clearbit/site_email_addresses": [
      "info@stayfit123.com",
      "support@stayfit123.com",
      "contact@stayfit123.com",
    ],
    "clearbit/site_phone_numbers": [
      "+31 88 666 9999"
    ],
    "clearbit/source": "prospector",
    "clearbit/tags": [
      "B2B",
      "Consulting & Professional Services",
      "Internet"
    ],
    "clearbit/tech": [
      "google_analytics",
      "outlook",
      "google_tag_manager",
      "microsoft_exchange_online",
      "apache",
      "microsoft_office_365",
      "new_relic",
      "vimeo",
      "google_maps",
      "typekit_by_adobe",
      "facebook_advertiser",
      "piwik"
    ],
    "clearbit/time_zone": "Europe/Amsterdam",
    "clearbit/twitter_avatar": "https://pbs.twimg.com/profile_images/518735780634868345696/In9ABC1-_normal.jpg",
    "clearbit/twitter_bio": "Stayfit 123 is the premier B2B fitness brand.",
    "clearbit/twitter_followers": 999,
    "clearbit/twitter_following": 111,
    "clearbit/twitter_handle": "stayfit123",
    "clearbit/twitter_id": "123456789",
    "clearbit/twitter_location": "Boschdijk 888, Eindhoven",
    "clearbit/twitter_site": "https://t.co/AbCdEF12gh",
    "clearbit/type": "private",
    "clearbit/utc_offset": 1,
    created_at: "2018-02-15T17:18:58Z",
    employees: 30,
    external_id: "9999",
    industry: "Health & Fitness",
    last_lead_source: "Growth",
    last_lead_source_detail: "G2Crowd",
    last_lead_source_timestamp: "2018-02-09T19:28:55Z",
    lead_source: "Growth",
    lead_source_detail: "G2Crowd",
    lead_source_timestamp: "2018-02-09T19:28:55Z",
    name: "Stayfit 123",
    plan: "Growth",
    updated_at: "2018-03-20T02:53:45Z",
    id: "5a85c10218da65a16309e75d",
    domain: "stayfit123.com"
  };

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

  const hullGroupedAccount = {
    attribution: {
      last_lead_source: "CQL",
      last_lead_source_detail: "http://drift.com/signup/",
      last_lead_source_timestamp: "2018-02-13T19:28:55Z"
    },
    clearbit: {
      category_industry: "Professional Services",
      category_industry_group: "Commercial & Professional Services",
      category_naics_code: "54",
      category_sector: "Industrials",
      category_sic_code: "73",
      category_sub_industry: "Consulting",
      description: "We are the premier fitness brand for all fitness levels.",
      domain: "stayfit123.com",
      domain_aliases: [
        "stayfit123.nl"
      ],
      email_provider: false,
      facebook_handle: "stayfit123",
      geo_city: "Eindhoven",
      geo_country: "Netherlands",
      geo_country_code: "NL",
      geo_lat: 51.4719807,
      geo_lng: 5.4450888,
      geo_postal_code: "5624 CL",
      geo_state: "Noord-Brabant",
      geo_state_code: "NB",
      geo_street_name: "Boschdijk",
      geo_street_number: "888",
      id: "some12345678id",
      linkedin_handle: "company/stayfit123",
      location: "Boschdijk 888, 5624 CL Eindhoven, Netherlands",
      logo: "https://logo.clearbit.com/stayfit123.com",
      metrics_alexa_global_rank: 999999,
      metrics_employees: 30,
      metrics_employees_range: "11-50",
      metrics_estimated_annual_revenue: "$1M-$10M",
      name: "Stayfit 123",
      prospected_at: "2018-03-20T02:23:54Z",
      prospected_from: "someuserid8978",
      site_email_addresses: [
        "info@stayfit123.com",
        "support@stayfit123.com",
        "contact@stayfit123.com"
      ],
      site_phone_numbers: [
        "+31 88 666 9999"
      ],
      source: "prospector",
      tags: [
        "B2B",
        "Consulting & Professional Services",
        "Internet"
      ],
      tech: [
        "google_analytics",
        "outlook",
        "google_tag_manager",
        "microsoft_exchange_online",
        "apache",
        "microsoft_office_365",
        "new_relic",
        "vimeo",
        "google_maps",
        "typekit_by_adobe",
        "facebook_advertiser",
        "piwik"
      ],
      time_zone: "Europe/Amsterdam",
      twitter_avatar: "https://pbs.twimg.com/profile_images/518735780634868345696/In9ABC1-_normal.jpg",
      twitter_bio: "Stayfit 123 is the premier B2B fitness brand.",
      twitter_followers: 999,
      twitter_following: 111,
      twitter_handle: "stayfit123",
      twitter_id: "123456789",
      twitter_location: "Boschdijk 888, Eindhoven",
      twitter_site: "https://t.co/AbCdEF12gh",
      type: "private",
      utc_offset: 1
    },
    created_at: "2018-02-15T17:18:58Z",
    employees: 2,
    external_id: "9999",
    id: "5a85c10218da65a16309e75d",
    industry: "Health & Fitness",
    last_lead_source: "Growth",
    last_lead_source_detail: "G2Crowd",
    last_lead_source_timestamp: "2018-02-09T19:28:55Z",
    lead_source: "Growth",
    lead_source_detail: "G2Crowd",
    lead_source_timestamp: "2018-02-09T19:28:55Z",
    name: "Stayfit 123",
    plan: "Growth",
    updated_at: "2018-03-20T02:53:45Z",
    domain: "stayfit123.com"
  };

  beforeEach(() => {
    util = new MappingUtil({ company: ACCOUNT_MAPPING, person: PERSON_MAPPING });
  });

  test("should have the company mappings initialized", () => {
    expect(util.clearbitCompanyMapping).toEqual(ACCOUNT_MAPPING);
  });

  test("should map a hull user with no external_id to an identify payload", () => {
    const usr = _.cloneDeep(hullUser);
    const result = util.mapToIdentify(usr);
    const expected = {
      userId: null,
      anonymousId: "58a1ca4d-6cd7-468f-9823-c5af39f4f5cc",
      traits: {
        created_at: "2018-02-14T00:16:25Z",
        email: "lydia@hullunittest.io",
        first_name: "Lydia",
        first_seen_at: "2018-01-07T19:28:55Z",
        first_session_initial_referrer: "",
        first_session_initial_url: "http://hull.io/testhull/",
        first_session_platform_id: "592e0e500b79ca51440017b1",
        first_session_started_at: "2018-01-07T19:28:55Z",
        hull: "identify",
        last_known_ip: "8.8.8.8",
        last_name: "Smith",
        last_seen_at: "2018-01-17T19:28:55Z",
        latest_session_initial_referrer: "",
        latest_session_initial_url: "http://hull.io/signup/",
        latest_session_platform_id: "592e0e500b79ca51440017b1",
        latest_session_started_at: "2018-01-17T19:28:55Z",
        name: "Lydia Smith",
        signup_session_initial_referrer: "",
        signup_session_initial_url: "http://drift.com/testhull/",
        signup_session_platform_id: "592e0e500b79ca51440017b1",
        signup_session_started_at: "2018-01-07T19:28:55Z"
      }
    };

    expect(result).toEqual(expected);
  });

  test("should map a hull user with external_id to an identify payload", () => {
    const usr = _.cloneDeep(hullUser);
    _.set(usr, "external_id", "hullio-12345");
    const result = util.mapToIdentify(usr);
    const expected = {
      userId: "hullio-12345",
      anonymousId: "58a1ca4d-6cd7-468f-9823-c5af39f4f5cc",
      traits: {
        created_at: "2018-02-14T00:16:25Z",
        email: "lydia@hullunittest.io",
        first_name: "Lydia",
        first_seen_at: "2018-01-07T19:28:55Z",
        first_session_initial_referrer: "",
        first_session_initial_url: "http://hull.io/testhull/",
        first_session_platform_id: "592e0e500b79ca51440017b1",
        first_session_started_at: "2018-01-07T19:28:55Z",
        hull: "identify",
        last_known_ip: "8.8.8.8",
        last_name: "Smith",
        last_seen_at: "2018-01-17T19:28:55Z",
        latest_session_initial_referrer: "",
        latest_session_initial_url: "http://hull.io/signup/",
        latest_session_platform_id: "592e0e500b79ca51440017b1",
        latest_session_started_at: "2018-01-17T19:28:55Z",
        name: "Lydia Smith",
        signup_session_initial_referrer: "",
        signup_session_initial_url: "http://drift.com/testhull/",
        signup_session_platform_id: "592e0e500b79ca51440017b1",
        signup_session_started_at: "2018-01-07T19:28:55Z"
      }
    };

    expect(result).toEqual(expected);
  });

  test("should map an account to a group call if user and account have an external_id", () => {
    const usr = _.cloneDeep(hullUser);
    _.set(usr, "external_id", "hullio-12345");
    const acct = _.cloneDeep(hullAccount);
    const result = util.mapToGroup(usr, acct);
    const expected = {
      userId: "hullio-12345",
      groupId: "9999",
      traits: {
        "attribution/last_lead_source": "CQL",
        "attribution/last_lead_source_detail": "http://hull.io/signup/",
        "attribution/last_lead_source_timestamp": "2018-02-13T19:28:55Z",
        "clearbit/category_industry": "Professional Services",
        "clearbit/category_industry_group": "Commercial & Professional Services",
        "clearbit/category_naics_code": "54",
        "clearbit/category_sector": "Industrials",
        "clearbit/category_sic_code": "73",
        "clearbit/category_sub_industry": "Consulting",
        "clearbit/description": "We are the premier fitness brand for all fitness levels.",
        "clearbit/domain": "stayfit123.com",
        "clearbit/domain_aliases": [
          "stayfit123.nl"
        ],
        "clearbit/email_provider": false,
        "clearbit/facebook_handle": "stayfit123",
        "clearbit/geo_city": "Eindhoven",
        "clearbit/geo_country": "Netherlands",
        "clearbit/geo_country_code": "NL",
        "clearbit/geo_lat": 51.4719807,
        "clearbit/geo_lng": 5.4450888,
        "clearbit/geo_postal_code": "5624 CL",
        "clearbit/geo_state": "Noord-Brabant",
        "clearbit/geo_state_code": "NB",
        "clearbit/geo_street_name": "Boschdijk",
        "clearbit/geo_street_number": "888",
        "clearbit/id": "some12345678id",
        "clearbit/linkedin_handle": "company/stayfit123",
        "clearbit/location": "Boschdijk 888, 5624 CL Eindhoven, Netherlands",
        "clearbit/logo": "https://logo.clearbit.com/stayfit123.com",
        "clearbit/metrics_alexa_global_rank": 999999,
        "clearbit/metrics_employees": 30,
        "clearbit/metrics_employees_range": "11-50",
        "clearbit/metrics_estimated_annual_revenue": "$1M-$10M",
        "clearbit/name": "Stayfit 123",
        "clearbit/prospected_at": "2018-03-20T02:23:54Z",
        "clearbit/prospected_from": "someuserid8978",
        "clearbit/site_email_addresses": [
          "info@stayfit123.com",
          "support@stayfit123.com",
          "contact@stayfit123.com",
        ],
        "clearbit/site_phone_numbers": [
          "+31 88 666 9999"
        ],
        "clearbit/source": "prospector",
        "clearbit/tags": [
          "B2B",
          "Consulting & Professional Services",
          "Internet"
        ],
        "clearbit/tech": [
          "google_analytics",
          "outlook",
          "google_tag_manager",
          "microsoft_exchange_online",
          "apache",
          "microsoft_office_365",
          "new_relic",
          "vimeo",
          "google_maps",
          "typekit_by_adobe",
          "facebook_advertiser",
          "piwik"
        ],
        "clearbit/time_zone": "Europe/Amsterdam",
        "clearbit/twitter_avatar": "https://pbs.twimg.com/profile_images/518735780634868345696/In9ABC1-_normal.jpg",
        "clearbit/twitter_bio": "Stayfit 123 is the premier B2B fitness brand.",
        "clearbit/twitter_followers": 999,
        "clearbit/twitter_following": 111,
        "clearbit/twitter_handle": "stayfit123",
        "clearbit/twitter_id": "123456789",
        "clearbit/twitter_location": "Boschdijk 888, Eindhoven",
        "clearbit/twitter_site": "https://t.co/AbCdEF12gh",
        "clearbit/type": "private",
        "clearbit/utc_offset": 1,
        created_at: "2018-02-15T17:18:58Z",
        employees: 30,
        industry: "Health & Fitness",
        last_lead_source: "Growth",
        last_lead_source_detail: "G2Crowd",
        last_lead_source_timestamp: "2018-02-09T19:28:55Z",
        lead_source: "Growth",
        lead_source_detail: "G2Crowd",
        lead_source_timestamp: "2018-02-09T19:28:55Z",
        name: "Stayfit 123",
        plan: "Growth",
        updated_at: "2018-03-20T02:53:45Z",
        domain: "stayfit123.com"
      }
    };

    expect(result).toEqual(expected);
  });

  test("should NOT map an account to a group call if user has no external_id", () => {
    const usr = _.cloneDeep(hullUser);
    const acct = _.cloneDeep(hullAccount);
    const result = util.mapToGroup(usr, acct);
    const expected = null;

    expect(result).toEqual(expected);
  });

  test("should NOT map an account to a group call if account has no external_id", () => {
    const usr = _.cloneDeep(hullUser);
    _.set(usr, "external_id", "hullio-12345");
    const acct = _.cloneDeep(hullAccount);
    _.set(acct, "external_id", null);
    const result = util.mapToGroup(usr, acct);
    const expected = null;

    expect(result).toEqual(expected);
  });

  test("should map a track event", () => {
    const usr = _.cloneDeep(hullUser);
    _.set(usr, "external_id", "hullio-12345");
    const evt = _.cloneDeep(hullEvent);
    const result = util.mapToEvent("track", usr, evt);
    const expected = {
      userId: "hullio-12345",
      anonymousId: "58a1ca4d-6cd7-468f-9823-c5af39f4f5cc",
      type: "track",
      event: evt.event,
      properties: evt.properties
    };

    expect(result).toEqual(expected);
  });

  test("should map a grouped account to a madkudu company payload", () => {
    const acct = _.cloneDeep(hullGroupedAccount);
    const result = util.mapToMadkuduCompany(acct);
    const expected = {
      company: {
        category: {
          industry: "Professional Services", industryGroup: "Commercial & Professional Services", sector: "Industrials", subIndustry: "Consulting"
        },
        description: "We are the premier fitness brand for all fitness levels.",
        domain: "stayfit123.com",
        domainAliases: ["stayfit123.nl"],
        emailProvider: false,
        facebook: { handle: "stayfit123" },
        geo: {
          city: "Eindhoven", country: "Netherlands", countryCode: "NL", lat: 51.4719807, lng: 5.4450888, postalCode: "5624 CL", state: "Noord-Brabant", stateCode: "NB", streetName: "Boschdijk", streetNumber: "888"
        },
        id: "some12345678id",
        linkedin: { handle: "company/stayfit123" },
        location: "Boschdijk 888, 5624 CL Eindhoven, Netherlands",
        logo: "https://logo.clearbit.com/stayfit123.com",
        metrics: { alexaGlobalRank: 999999, employees: 30 },
        name: "Stayfit 123",
        site: { emailAddresses: ["info@stayfit123.com", "support@stayfit123.com", "contact@stayfit123.com"], phoneNumbers: ["+31 88 666 9999"] },
        tags: ["B2B", "Consulting & Professional Services", "Internet"],
        tech: ["google_analytics", "outlook", "google_tag_manager", "microsoft_exchange_online", "apache", "microsoft_office_365", "new_relic", "vimeo", "google_maps", "typekit_by_adobe", "facebook_advertiser", "piwik"],
        timeZone: "Europe/Amsterdam",
        twitter: {
          avatar: "https://pbs.twimg.com/profile_images/518735780634868345696/In9ABC1-_normal.jpg", bio: "Stayfit 123 is the premier B2B fitness brand.", followers: 999, following: 111, handle: "stayfit123", id: "123456789", location: "Boschdijk 888, Eindhoven", site: "https://t.co/AbCdEF12gh"
        },
        type: "private",
        utcOffset: 1
      },
      domain: "stayfit123.com"
    };

    expect(result).toEqual(expected);
  });

  test("should map a grouped account without clearbit data to a madkudu company payload", () => {
    const acct = _.cloneDeep(hullGroupedAccount);
    _.set(acct, "clearbit");
    const result = util.mapToMadkuduCompany(acct);
    const expected = {
      domain: "stayfit123.com"
    };
    expect(result).toEqual(expected);
  });

  test("should parse madkudu company response into account traits", () => {
    const mkResponse = {
      domain: "madkudu.com",
      object_type: "company",
      properties: {
        name: "MadKudu Inc",
        domain: "madkudu.com",
        location: {
          state: "California",
          state_code: "CA",
          country: "United States",
          country_code: "US",
          tags: ["english_speaking", "high_gdp_per_capita"]
        },
        number_of_employees: 17000,
        industry: "Software",
        customer_fit: {
          segment: "good",
          top_signals: [
            { name: "employee count", value: "180", type: "positive" },
            { name: "web traffic volume", value: "medium", type: "positive" }
          ]
        }
      }
    };
    const result = util.mapMadkuduCompanyToTraits(mkResponse);
    const expected = {
      customer_fit_segment: "good",
      name: "MadKudu Inc",
      number_of_employees: 17000,
      signal_employee_count: "180",
      signal_web_traffic_volume: "medium",
      top_signals_positive: ["employee count", "web traffic volume"]
    };

    expect(_.omit(result, "fetched_at")).toEqual(expected);
    expect(result.fetched_at).toBeDefined();
  });

  test("should return null if no properties are in the Madkudu reponse for companies", () => {
    const mkResponse = {
      domain: "madkudu.com",
      object_type: "company"
    };
    const result = util.mapMadkuduCompanyToTraits(mkResponse);

    expect(result).toBeNull();
  });

  test("should return null if the object type is not company in the Madkudu reponse for companies", () => {
    const mkResponse = {
      domain: "madkudu.com",
      object_type: "foo",
      properties: {
        name: "MadKudu Inc",
        domain: "madkudu.com",
        location: {
          state: "California",
          state_code: "CA",
          country: "United States",
          country_code: "US",
          tags: ["english_speaking", "high_gdp_per_capita"]
        },
        number_of_employees: 17000,
        industry: "Software",
        customer_fit: {
          segment: "good",
          top_signals: [
            { name: "employee count", value: "180", type: "positive" },
            { name: "web traffic volume", value: "medium", type: "positive" }
          ]
        }
      }
    };
    const result = util.mapMadkuduCompanyToTraits(mkResponse);

    expect(result).toBeNull();
  });
});
