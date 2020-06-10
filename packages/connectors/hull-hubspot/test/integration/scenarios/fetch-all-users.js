// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
const contactPropertyGroups = require("../fixtures/get-contacts-groups");
import connectorConfig from "../../../server/config";

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = 1;
process.env.CLIENT_SECRET = 1;

const incomingData = require("../fixtures/get-contacts-recently-updated");

const connector = {
  private_settings: {
    token: "hubToken",
    last_fetch_at: 1419967066626,
    mark_deleted_contacts: false,
    mark_deleted_companies: false,
    incoming_user_claims: [
      { hull: 'email', service: '$[\'identity-profiles\'][*].identities[?(@.type === \'EMAIL\')].value', required: false },
      { hull: 'email', service: 'properties.email.value', required: false }
    ],
    incoming_user_attributes: [
      { service: '`canonical-vid` ? `canonical-vid` : `vid`', hull: 'traits_hubspot/id', readOnly: true, overwrite: true },
      { service: 'properties.email.value', hull: 'traits_hubspot/email', readOnly: true, overwrite: true },
      { service: '`merged-vids`', hull: 'traits_hubspot/merged_vids', overwrite: true },
      { service: 'properties.firstname.value', hull: 'traits_hubspot/first_name', overwrite: true },
      { service: 'properties.phone.value', hull: 'traits_hubspot/phone', overwrite: true },
      { service: "properties.lastname.value & ' some string ' & $string(100)", hull: 'traits_hubspot/last_name', overwrite: true },
      { service: "properties.hs_additional_emails.value.$split(';')", hull: 'traits_hubspot/additional_emails', overwrite: true }
    ]
  }
};

it("should fetch all users using settings", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.jsonHandler,
      handlerUrl: "fetch-all-contacts",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, contactPropertyGroups);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/contacts/v1/lists/all/contacts/all?count=100&vidOffset&property=email&property=firstname&property=phone&property=lastname&property=hs_additional_emails&property=email")
          .reply(200, incomingData);
        scope.get("/contacts/v1/lists/all/contacts/all?count=100&vidOffset=3714024&property=email&property=firstname&property=phone&property=lastname&property=hs_additional_emails&property=email")
          .reply(200, { contacts: [], "has-more": false, "time-offset": 0 });
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/contacts/v2/groups", "status": 200, })
        ]),
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/properties/v1/companies/groups", "status": 200, })
        ]),
        ["info","incoming.job.start",{},{"jobName":"fetchAllContacts","type":"user","propertiesToFetch":["email","firstname","phone","lastname","hs_additional_emails","email"]}],
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/contacts/v1/lists/all/contacts/all", "status": 200, })
        ]),
        ["info","incoming.job.progress",{},{"jobName":"fetchAllContacts","type":"user","progress":2}],
        ["debug","saveContacts",{},2],
        ["debug","incoming.user",{},{
          "claims":{"email":"testingapis@hubspot.com","anonymous_id":"hubspot:3234574"},
          "traits":{
            "hubspot/id":3234574,
            "hubspot/merged_vids":null,
            "hubspot/first_name":"Jeff",
            "hubspot/last_name":"Testing some string 100",
            "first_name":{"operation":"setIfNull","value":"Jeff"},
            "last_name":{"operation":"setIfNull","value":"Testing some string 100"},
            "hubspot/additional_emails": ["1", "2", "3"]
          }
        }],
        ["debug","incoming.account.link.skip",{"subject_type":"user","user_email":"testingapis@hubspot.com","user_anonymous_id":"hubspot:3234574"},{"reason":"incoming linking is disabled, you can enabled it in the settings"}],
        ["debug","incoming.user",{},{
          "claims":{"email":"new-email@hubspot.com","anonymous_id":"hubspot:3714024"},
          "traits":{
            "hubspot/id":3714024,
            "hubspot/merged_vids":null,
            "hubspot/first_name":"Updated",
            "hubspot/last_name":"Record some string 100",
            "first_name":{"operation":"setIfNull","value":"Updated"},
            "last_name":{"operation":"setIfNull","value":"Record some string 100"}
          }
        }],
        ["debug","incoming.account.link.skip",{"subject_type":"user","user_email":"new-email@hubspot.com","user_anonymous_id":"hubspot:3714024"},{"reason":"incoming linking is disabled, you can enabled it in the settings"}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/contacts/v1/lists/all/contacts/all","status":200,"vars":{}}],
        ["debug","incoming.user.success",{"subject_type":"user","user_email":"testingapis@hubspot.com","user_anonymous_id":"hubspot:3234574"},{"traits":{"hubspot/id":3234574,"hubspot/merged_vids":null,"hubspot/first_name":"Jeff","hubspot/additional_emails": ["1", "2", "3"], "hubspot/last_name":"Testing some string 100","first_name":{"operation":"setIfNull","value":"Jeff"},"last_name":{"operation":"setIfNull","value":"Testing some string 100"}}}],
        ["debug","incoming.user.success",{"subject_type":"user","user_email":"new-email@hubspot.com","user_anonymous_id":"hubspot:3714024"},{"traits":{"hubspot/id":3714024,"hubspot/merged_vids":null,"hubspot/first_name":"Updated","hubspot/last_name":"Record some string 100","first_name":{"operation":"setIfNull","value":"Updated"},"last_name":{"operation":"setIfNull","value":"Record some string 100"}}}],
        ["info","incoming.job.success",{},{"jobName":"fetchAllContacts"}]
      ],
      firehoseEvents: [
        ["traits",{"asUser":{"email":"testingapis@hubspot.com","anonymous_id":"hubspot:3234574"},"subjectType":"user"},
          {
            "hubspot/id":3234574,
            "hubspot/merged_vids":null,
            "hubspot/first_name":"Jeff",
            "hubspot/last_name":"Testing some string 100",
            "first_name":{"operation":"setIfNull","value":"Jeff"},
            "last_name":{"operation":"setIfNull","value":"Testing some string 100"},
            "hubspot/additional_emails": ["1", "2", "3"]
          }
        ],
        ["traits",{"asUser":{"email":"new-email@hubspot.com","anonymous_id":"hubspot:3714024"},"subjectType":"user"},
          {
            "hubspot/id":3714024,
            "hubspot/merged_vids":null,
            "hubspot/first_name":"Updated",
            "hubspot/last_name":"Record some string 100",
            "first_name":{"operation":"setIfNull","value":"Updated"},
            "last_name":{"operation":"setIfNull","value":"Record some string 100"}
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.incoming.users", 2],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
      ],
      platformApiCalls: [
        ["GET","/api/v1/app",{},{}],
        ["GET","/api/v1/users_segments?shipId=9993743b22d60dd829001999",{"shipId":"9993743b22d60dd829001999"},{}],
        ["GET","/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",{"shipId":"9993743b22d60dd829001999"},{}],
        ["GET","/api/v1/app",{},{}],
        ["PUT","/api/v1/9993743b22d60dd829001999",{},{"private_settings":{"token":"hubToken","last_fetch_at":1419967066626,"mark_deleted_contacts":false,"mark_deleted_companies":false,"incoming_user_claims":[{"hull":"email","service":"$['identity-profiles'][*].identities[?(@.type === 'EMAIL')].value","required":false},{"hull":"email","service":"properties.email.value","required":false}],"incoming_user_attributes":[{"service":"`canonical-vid` ? `canonical-vid` : `vid`","hull":"traits_hubspot/id","readOnly":true,"overwrite":true},{"service":"properties.email.value","hull":"traits_hubspot/email","readOnly":true,"overwrite":true},{"service":"`merged-vids`","hull":"traits_hubspot/merged_vids","overwrite":true},{"service":"properties.firstname.value","hull":"traits_hubspot/first_name","overwrite":true},{"service":"properties.phone.value","hull":"traits_hubspot/phone","overwrite":true},{"service":"properties.lastname.value","hull":"traits_hubspot/last_name","overwrite":true}],"fetch_count":2},"refresh_status":false}]]
    };
  });
});
