// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");

import connectorConfig from "../../../server/config";
/*
test("send smart-notifier user update to outreach with owner email that is resolved", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = {
      "channel": "user:update",
      "connector": {
        "private_settings": {
          "access_token": "1",
          "refresh_token": "2",
          "link_users_in_service": true,
          "webhook_id": 31,
          "user_claims": [{ "hull": "email", "service": "emails" }],
          "outgoing_user_attributes": [
            { "hull": "traits_testattributes/description", "service": "custom20" },
            { "hull": "traits_outreach/owner_email", "service": "ownerEmail" }
          ],
          "incoming_user_attributes": [
            { "hull": "traits_outreach/custom1", "service": "custom1" },
            { "hull": "traits_outreach/custom2", "service": "custom2" },
            { "hull": "traits_outreach/personalnote2", "service": "personalNote1" }
          ],
          "synchronized_user_segments": ["5bffc38f625718d58b000004"]
        }
      },
      "messages": [
        {
          "user": {
            "traits_outreach/owner_email": "frank@rei.com",
            "traits_outreach/id": 16,
            "id": "5bd329d5e2bcf3eeaf000099",
            "email": "darth@darksideinc.com",
            "traits_testattributes/description": "Description of darth vader"
          },
          "changes": {
            "user": {
              "traits_testattributes/description": ["some test data2", "Description of darth vader"],
              "email": ["darthdude@darksideinc.com", "darth@darksideinc.com"]
            }
          },
          "account": { "outreach/id": 20 },
          "segments": [
            { "id": "5bffc38f625718d58b000004", "name": "Smugglers" },
            { "id": "5bd720690026ca86b000004f", "name": "Star Wars Users" }
          ],
          "message_id": "f52f5c6d4ab475c2f9d95d6d84855d083adfbc74"
        }
      ]
    };
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");

        scope
          .get("/api/v2/users/?page[limit]=1000&page[offset]=0")
          .reply(201, {
            data: [
              { id: 0, attributes: { email: "random1@rei.com" }},
              { id: 1, attributes: { email: "random2@reic.om" }},
              { id: 2, attributes: { email: "frank@rei.com" }}
            ]
          });

        scope
          .get("/api/v2/prospects/16")
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-lookup.json"));

        scope
          .intercept('/api/v2/prospects/16', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-patch.json"));

        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 200,"url": "/prospects/16" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 201,"url": "/users/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 200,"url": "/prospects/16" })],
        ["info", "outgoing.user.success", expect.objectContaining({ "subject_type": "user", "user_email": "darth@darksideinc.com" }), {
          "data": {
            "data": {
              "type": "prospect",
              "id": 16,
              "relationships": {
                "account": {
                  "data": {
                    "type": "account",
                    "id": 20
                  }
                },
                "owner": {
                  "data": {
                    "type": "user",
                    "id": "2"
                  }
                }
              },
              "attributes": {
                "custom20": "Description of darth vader",
                "emails": [
                  "darth@darksideinc.com",
                  "anotherdarth@gmail.com"
                ]
              }
            }
          },
          "type": "Prospect"
        }],
        ["debug", "incoming.user.success", expect.whatever(), expect.whatever()],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}, "subjectType": "user"}, {"outreach/custom1": { "operation": "set", "value": null }, "outreach/custom2": { "operation": "set", "value": null }, "outreach/id": {"operation": "set", "value": 16}, "outreach/personalnote2": {"operation": "set", "value": "sith lord, don't mention padme"}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ]
    });
  });
});

test("send smart-notifier user update to outreach with owner email that is unable to be resolved", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = {
      "channel": "user:update",
      "connector": {
        "private_settings": {
          "access_token": "1",
          "refresh_token": "2",
          "link_users_in_service": true,
          "webhook_id": 31,
          "user_claims": [{ "hull": "email", "service": "emails" }],
          "outgoing_user_attributes": [
            { "hull": "traits_testattributes/description", "service": "custom20" },
            { "hull": "traits_outreach/owner_email", "service": "ownerEmail" }
          ],
          "incoming_user_attributes": [
            { "hull": "traits_outreach/custom1", "service": "custom1" },
            { "hull": "traits_outreach/custom2", "service": "custom2" },
            { "hull": "traits_outreach/personalnote2", "service": "personalNote1" }
          ],
          "synchronized_user_segments": ["5bffc38f625718d58b000004"]
        }
      },
      "messages": [
        {
          "user": {
            "traits_outreach/owner_email": "wrongemail@rei.com",
            "traits_outreach/id": 16,
            "id": "5bd329d5e2bcf3eeaf000099",
            "email": "darth@darksideinc.com",
            "traits_testattributes/description": "Description of darth vader"
          },
          "changes": {
            "user": {
              "traits_testattributes/description": ["some test data2", "Description of darth vader"],
              "email": ["darthdude@darksideinc.com", "darth@darksideinc.com"]
            }
          },
          "account": { "outreach/id": 20 },
          "segments": [
            { "id": "5bffc38f625718d58b000004", "name": "Smugglers" },
            { "id": "5bd720690026ca86b000004f", "name": "Star Wars Users" }
          ],
          "message_id": "f52f5c6d4ab475c2f9d95d6d84855d083adfbc74"
        }
      ]
    };
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");

        scope
          .get("/api/v2/users/?page[limit]=1000&page[offset]=0")
          .reply(201, {
            data: [
              { id: 0, attributes: { email: "random1@rei.com" }},
              { id: 1, attributes: { email: "random2@reic.om" }},
              { id: 2, attributes: { email: "frank@rei.com" }}
            ]
          });

        scope
          .get("/api/v2/users/?page[limit]=1000&page[offset]=0")
          .reply(201, {
            data: [
              { id: 0, attributes: { email: "random1@rei.com" }},
              { id: 1, attributes: { email: "random2@reic.om" }},
              { id: 2, attributes: { email: "frank@rei.com" }}
            ]
          });

        scope
          .get("/api/v2/prospects/16")
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-lookup.json"));

        scope
          .intercept('/api/v2/prospects/16', 'PATCH')
          .reply(400, {
            "errors": [
              {
                "id": "permittedParams.relationshipResourceNotFound",
                "title": "Relationship Resource Not Found",
                "detail": "Could not find 'user' with ID ''."
              }
            ]
          });

        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 200,"url": "/prospects/16" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 201,"url": "/users/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 201,"url": "/users/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 400,"url": "/prospects/16" })],
        ["error", "outgoing.user.error", expect.objectContaining({ "subject_type": "user", "user_email": "darth@darksideinc.com" }),
          {
            "data": {
              "data": {
                "type": "prospect",
                "id": 16,
                "relationships": {
                  "account": {
                    "data": {
                      "type": "account",
                      "id": 20
                    }
                  },
                  "owner": {
                    "data": {
                      "type": "user",
                      "id": null
                    }
                  }
                },
                "attributes": {
                  "custom20": "Description of darth vader",
                  "emails": [
                    "darth@darksideinc.com",
                    "anotherdarth@gmail.com"
                  ]
                }
              }
            },
            "type": "Prospect",
            "error": "Outreach has rejected the objects being sent, please review the object for any old relationships that may not exist anymore. If you think this is correct, please contact Hull support (Outreach Error Details: [permittedParams.relationshipResourceNotFound] Relationship Resource Not Found: Could not find 'user' with ID ''.)"
          }
        ],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment","connector.request",1],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","connector.service_api.error",1],
        ["increment","service.service_api.errors",1]
      ]
    });
  });
});
*/
test("send smart-notifier user update to outreach with owner email mapped but missing on user", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = {
      "channel": "user:update",
      "connector": {
        "private_settings": {
          "access_token": "1",
          "refresh_token": "2",
          "link_users_in_service": true,
          "webhook_id": 31,
          "user_claims": [{ "hull": "email", "service": "emails" }],
          "outgoing_user_attributes": [
            { "hull": "traits_testattributes/description", "service": "custom20" },
            { "hull": "traits_outreach/owner_email", "service": "ownerEmail" }
          ],
          "incoming_user_attributes": [
            { "hull": "traits_outreach/custom1", "service": "custom1" },
            { "hull": "traits_outreach/custom2", "service": "custom2" },
            { "hull": "traits_outreach/personalnote2", "service": "personalNote1" }
          ],
          "synchronized_user_segments": ["5bffc38f625718d58b000004"]
        }
      },
      "messages": [
        {
          "user": {
            "traits_outreach/id": 16,
            "id": "5bd329d5e2bcf3eeaf000099",
            "email": "darth@darksideinc.com",
            "traits_testattributes/description": "Description of darth vader"
          },
          "changes": {
            "user": {
              "traits_testattributes/description": ["some test data2", "Description of darth vader"],
              "email": ["darthdude@darksideinc.com", "darth@darksideinc.com"]
            }
          },
          "account": { "outreach/id": 20 },
          "segments": [
            { "id": "5bffc38f625718d58b000004", "name": "Smugglers" },
            { "id": "5bd720690026ca86b000004f", "name": "Star Wars Users" }
          ],
          "message_id": "f52f5c6d4ab475c2f9d95d6d84855d083adfbc74"
        }
      ]
    };
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");

        scope
          .get("/api/v2/prospects/16")
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-lookup.json"));

        scope
          .intercept('/api/v2/prospects/16', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-patch.json"));

        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 200,"url": "/prospects/16" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 200,"url": "/prospects/16" })],
        ["info", "outgoing.user.success", expect.objectContaining({ "subject_type": "user", "user_email": "darth@darksideinc.com" }), {
          "data": {
            "data": {
              "type": "prospect",
              "id": 16,
              "relationships": {
                "account": {
                  "data": {
                    "type": "account",
                    "id": 20
                  }
                },
                "owner": {
                  "data": null
                }
              },
              "attributes": {
                "custom20": "Description of darth vader",
                "emails": [
                  "darth@darksideinc.com",
                  "anotherdarth@gmail.com"
                ]
              }
            }
          },
          "type": "Prospect"
        }],
        ["debug", "incoming.user.success", expect.whatever(), expect.whatever()],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}, "subjectType": "user"}, {"outreach/custom1": { "operation": "set", "value": null }, "outreach/custom2": { "operation": "set", "value": null }, "outreach/id": {"operation": "set", "value": 16}, "outreach/personalnote2": {"operation": "set", "value": "sith lord, don't mention padme"}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ]
    });
  });
});
/*
test("send smart-notifier user update to outreach with owner email needs to be 'forcefully' resolved", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = {
      "channel": "user:update",
      "connector": {
        "private_settings": {
          "access_token": "1",
          "refresh_token": "2",
          "link_users_in_service": true,
          "webhook_id": 31,
          "user_claims": [{ "hull": "email", "service": "emails" }],
          "outgoing_user_attributes": [
            { "hull": "traits_testattributes/description", "service": "custom20" },
            { "hull": "traits_outreach/owner_email", "service": "ownerEmail" }
          ],
          "incoming_user_attributes": [
            { "hull": "traits_outreach/custom1", "service": "custom1" },
            { "hull": "traits_outreach/custom2", "service": "custom2" },
            { "hull": "traits_outreach/personalnote2", "service": "personalNote1" }
          ],
          "synchronized_user_segments": ["5bffc38f625718d58b000004"]
        }
      },
      "messages": [
        {
          "user": {
            "traits_outreach/owner_email": "bobby@rei.com",
            "traits_outreach/id": 16,
            "id": "5bd329d5e2bcf3eeaf000099",
            "email": "darth@darksideinc.com",
            "traits_testattributes/description": "Description of darth vader"
          },
          "changes": {
            "user": {
              "traits_testattributes/description": ["some test data2", "Description of darth vader"],
              "email": ["darthdude@darksideinc.com", "darth@darksideinc.com"]
            }
          },
          "account": { "outreach/id": 20 },
          "segments": [
            { "id": "5bffc38f625718d58b000004", "name": "Smugglers" },
            { "id": "5bd720690026ca86b000004f", "name": "Star Wars Users" }
          ],
          "message_id": "f52f5c6d4ab475c2f9d95d6d84855d083adfbc74"
        }
      ]
    };
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");

        scope
          .get("/api/v2/users/?page[limit]=1000&page[offset]=0")
          .reply(201, {
            data: [
              { id: 2, attributes: { email: "frank@rei.com" }}
            ]
          });

        scope
          .get("/api/v2/users/?page[limit]=1000&page[offset]=0")
          .reply(201, {
            data: [
              { id: 0, attributes: { email: "random1@rei.com" }},
              { id: 1, attributes: { email: "random2@reic.om" }},
              { id: 2, attributes: { email: "frank@rei.com" }},
              { id: 3, attributes: { email: "bobby@rei.com" }}
            ]
          });

        scope
          .get("/api/v2/prospects/16")
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-lookup.json"));

        scope
          .intercept('/api/v2/prospects/16', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-patch.json"));

        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 200,"url": "/prospects/16" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 201,"url": "/users/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 201,"url": "/users/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 200,"url": "/prospects/16" })],
        ["info", "outgoing.user.success", expect.objectContaining({ "subject_type": "user", "user_email": "darth@darksideinc.com" }), {
          "data": {
            "data": {
              "type": "prospect",
              "id": 16,
              "relationships": {
                "account": {
                  "data": {
                    "type": "account",
                    "id": 20
                  }
                },
                "owner": {
                  "data": {
                    "type": "user",
                    "id": "3"
                  }
                }
              },
              "attributes": {
                "custom20": "Description of darth vader",
                "emails": [
                  "darth@darksideinc.com",
                  "anotherdarth@gmail.com"
                ]
              }
            }
          },
          "type": "Prospect"
        }],
        ["debug", "incoming.user.success", expect.whatever(), expect.whatever()],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}, "subjectType": "user"}, {"outreach/custom1": { "operation": "set", "value": null }, "outreach/custom2": { "operation": "set", "value": null }, "outreach/id": {"operation": "set", "value": 16}, "outreach/personalnote2": {"operation": "set", "value": "sith lord, don't mention padme"}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ]
    });
  });
});
*/
