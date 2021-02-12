// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

const connector = {
  private_settings: {
    api_key: "abcdfghaygfai17285",
    enriched_account_segments: ["59f09bc7f9c5a94af600076d"]
  }
};
const accountsSegments = [
  {
    name: "Madkudu Account",
    id: "59f09bc7f9c5a94af600076d"
  }
];

describe("Account Enrichment Tests", () => {
  it("should not enrich account if enrichment disabled", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {},
          connector: {
            private_settings: {
              api_key: "abcdfghaygfai17285",
              enriched_account_segments: []
            }
          },
          usersSegments: [],
          accountsSegments,
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              account: {
                domain: "madkudu.com",
                name: "Madkudu",
                external_id: "hull12345678"
              },
              account_segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu Account",
                  type: "accounts_segment"
                }
              ]
            }
          ],
          response: {
            flow_control: {
              type: "next"
            }
          },
          logs: [],
          firehoseEvents: [],
          metrics: [["increment", "connector.request", 1]],
          platformApiCalls: []
        };
      }
    );
  });

  it("should not enrich account if not in enrichment segment", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {},
          connector: {
            private_settings: {
              api_key: "abcdfghaygfai17285",
              enriched_account_segments: ["somesegment"]
            }
          },
          usersSegments: [],
          accountsSegments,
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              account: {
                domain: "madkudu.com",
                name: "Madkudu",
                external_id: "hull12345678"
              },
              account_segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu Account",
                  type: "accounts_segment"
                }
              ]
            }
          ],
          response: {
            flow_control: {
              type: "next"
            }
          },
          logs: [],
          firehoseEvents: [],
          metrics: [["increment", "connector.request", 1]],
          platformApiCalls: []
        };
      }
    );
  });

  it("should not enrich account due to missing api key", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {},
          connector: {
            private_settings: {
              enriched_account_segments: ["59f09bc7f9c5a94af600076d"]
            }
          },
          usersSegments: [],
          accountsSegments,
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              account: {
                domain: "madkudu.com",
                name: "Madkudu",
                external_id: "hull12345678"
              },
              account_segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu Account"
                }
              ]
            }
          ],
          response: {
            flow_control: {
              type: "retry",
              size: 10,
              in: 6000,
              in_time: 10
            },
            error: {
              message: "No API Key available",
              name: "ConfigurationError",
              code: "HULL_ERR_CONFIGURATION"
            }
          },
          logs: [],
          firehoseEvents: [],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "connector.transient_error", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should enrich account", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {
            const scope = nock("https://api.madkudu.com/v1");

            scope.get("/companies?domain=madkudu.com").reply(200, {
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
                    {
                      name: "web traffic volume",
                      value: "medium",
                      type: "positive"
                    }
                  ]
                }
              }
            });

            return scope;
          },
          connector,
          usersSegments: [],
          accountsSegments,
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              account: {
                domain: "madkudu.com",
                name: "Madkudu",
                external_id: "hull12345678",
                "clearbit/category_industry": "Professional Services",
                "clearbit/category_industry_group":
                  "Commercial & Professional Services",
                "clearbit/category_naics_code": "54",
                "clearbit/category_sector": "Industrials",
                "clearbit/category_sic_code": "73",
                "clearbit/category_sub_industry": "Consulting",
                "clearbit/description":
                  "We are the premier fitness brand for all fitness levels.",
                "clearbit/domain": "stayfit123.com",
                "clearbit/domain_aliases": ["stayfit123.nl"],
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
                "clearbit/location":
                  "Boschdijk 888, 5624 CL Eindhoven, Netherlands",
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
                  "contact@stayfit123.com"
                ],
                "clearbit/site_phone_numbers": ["+31 88 666 9999"],
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
                "clearbit/twitter_avatar":
                  "https://pbs.twimg.com/profile_images/518735780634868345696/In9ABC1-_normal.jpg",
                "clearbit/twitter_bio":
                  "Stayfit 123 is the premier B2B fitness brand.",
                "clearbit/twitter_followers": 999,
                "clearbit/twitter_following": 111,
                "clearbit/twitter_handle": "stayfit123",
                "clearbit/twitter_id": "123456789",
                "clearbit/twitter_location": "Boschdijk 888, Eindhoven",
                "clearbit/twitter_site": "https://t.co/AbCdEF12gh",
                "clearbit/type": "private",
                "clearbit/utc_offset": 1
              },
              account_segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu Account",
                  type: "accounts_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ]
            }
          ],
          response: {
            flow_control: {
              type: "next"
            }
          },
          logs: [
            [
              "debug",
              "connector.service_api.call",
              {
                request_id: expect.whatever()
              },
              {
                responseTime: expect.whatever(),
                method: "GET",
                url: "https://api.madkudu.com/v1/companies",
                status: 200,
                vars: undefined
              }
            ],
            [
              "debug",
              "incoming.account.progress",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_external_id: "hull12345678",
                account_domain: "madkudu.com"
              },
              {
                action: "enrichment",
                data: {
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
                        {
                          name: "employee count",
                          value: "180",
                          type: "positive"
                        },
                        {
                          name: "web traffic volume",
                          value: "medium",
                          type: "positive"
                        }
                      ]
                    }
                  }
                }
              }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  external_id: "hull12345678",
                  domain: "madkudu.com"
                },
                subjectType: "account"
              },
              {
                "madkudu/name": "MadKudu Inc",
                "madkudu/domain": "madkudu.com",
                "madkudu/number_of_employees": 17000,
                "madkudu/industry": "Software",
                "madkudu/location_state": "California",
                "madkudu/location_state_code": "CA",
                "madkudu/country": "United States",
                "madkudu/country_code": "US",
                "madkudu/location_tags": [
                  "english_speaking",
                  "high_gdp_per_capita"
                ],
                "madkudu/customer_fit_segment": "good",
                "madkudu/customer_fit_top_signals": [
                  {
                    name: "employee count",
                    value: "180",
                    type: "positive"
                  },
                  {
                    name: "web traffic volume",
                    value: "medium",
                    type: "positive"
                  }
                ],
                "madkudu/customer_fit_top_signals_positive": [
                  "employee count",
                  "web traffic volume"
                ]
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "connector.service_api.response_time", expect.whatever()]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  /*
  it("should not enrich account after 500 status", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://api.madkudu.com/v1");

          scope
            .get("/companies?domain=madkudu.com")
            .reply(500)

          return scope;
        },
        connector,
        usersSegments: [],
        accountsSegments,
        messages: [{
          "message_id": "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
          "account": {
            "domain": "madkudu.com",
            "name": "Madkudu",
            "external_id": "hull12345678"
          },
          "account_segments": [{
            "id": "59f09bc7f9c5a94af600076d",
            "name": "Madkudu Account"
          }]
        }],
        response: {},
        logs: [
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.madkudu.com/v1/companies",
              "status": 500
            }
          ],
          [
            "error",
            "incoming.account.error",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "hull12345678",
              "account_domain": "madkudu.com"
            },
            {
              "message": "Internal Server Error"
            }
          ]
        ],
        firehoseEvents: [],
        metrics: [],
        platformApiCalls: []
      };
    });
  });*/
});
