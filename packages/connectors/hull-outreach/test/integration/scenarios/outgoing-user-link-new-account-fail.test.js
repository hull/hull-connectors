// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


test("send smart-notifier user update to outreach and link account", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = _.cloneDeep(require("../fixtures/notifier-payloads/outgoing-user-link-new-account.json"));
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope
          .get("/api/v2/accounts/?filter[domain]=afterlife.com")
          .reply(200, { "data":[] });
        scope
          .post("/api/v2/accounts/", {"data":{"type":"account","attributes":{"domain":"afterlife.com","custom20":"very hot","name":"afterlife.com"}}})
          .reply(422);
        scope
          .intercept('/api/v2/prospects/18', 'PATCH', {"data":{"type":"prospect","id":18,"attributes":{"custom20":"in the afterlife"}}})
          .reply(200, require("../fixtures/api-responses/outgoing-user-link-patch-user.json"));
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
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call",expect.whatever(), {"method": "POST", "responseTime": expect.whatever(), "status": 422, "url": "/accounts/", "vars": {}}],
        ["error", "outgoing.account.skip", {"account_domain": "afterlife.com", "account_id": "5c0fd68ad884b4373800011a", "request_id": expect.whatever(), "subject_type": "account"}, {"error": "Outreach has rejected the objects being sent, please review attributes that you have in your filters to make sure that you've selected all the fields that outreach requires, if you think this is correct, please contact Hull support"}],
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "PATCH", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/18", "vars": {}}],
        ["info", "outgoing.user.success", {"request_id": expect.whatever(), "subject_type": "user", "user_email": "fettisbest@gmail.com", "user_id": "5bd329d5e2bcf3eeaf00009f"}, {"data": {"data": {"attributes": {"custom20": "in the afterlife"}, "id": 18, "type": "prospect"}}, "operation": "patch", "response": {"attributes": {"addedAt": null, "addressCity": null, "addressCountry": null, "addressState": null, "addressStreet": null, "addressStreet2": null, "addressZip": null, "angelListUrl": null, "availableAt": null, "callsOptStatus": null, "callsOptedAt": null, "campaignName": null, "clickCount": 0, "contactHistogram": expect.whatever(), "createdAt": "2018-10-24T20:24:30.000Z", "custom1": "probably is a smuggler too", "custom10": null, "custom11": null, "custom12": null, "custom13": null, "custom14": null, "custom15": null, "custom16": null, "custom17": null, "custom18": null, "custom19": null, "custom2": null, "custom20": "in the afterlife", "custom21": null, "custom22": null, "custom23": null, "custom24": null, "custom25": null, "custom26": null, "custom27": null, "custom28": null, "custom29": null, "custom3": null, "custom30": null, "custom31": null, "custom32": null, "custom33": null, "custom34": null, "custom35": null, "custom36": null, "custom37": null, "custom38": null, "custom39": null, "custom4": null, "custom40": null, "custom41": "custom1triggered", "custom42": null, "custom43": null, "custom44": null, "custom45": null, "custom46": null, "custom47": null, "custom48": null, "custom49": null, "custom5": null, "custom50": null, "custom51": null, "custom52": null, "custom53": null, "custom54": null, "custom55": null, "custom6": null, "custom7": null, "custom8": null, "custom9": null, "dateOfBirth": null, "degree": null, "emails": ["fettisbest@gmail.com"], "emailsOptStatus": null, "emailsOptedAt": null, "engagedAt": null, "engagedScore": 0, "eventName": null, "externalId": null, "externalOwner": null, "externalSource": null, "facebookUrl": null, "firstName": "Bobba", "gender": null, "githubUrl": null, "githubUsername": null, "googlePlusUrl": null, "graduationDate": null, "homePhones": [], "jobStartDate": null, "lastName": "Fett", "linkedInConnections": null, "linkedInId": null, "linkedInSlug": null, "linkedInUrl": null, "middleName": null, "mobilePhones": [], "name": "Bobba Fett", "nickname": null, "occupation": null, "openCount": 0, "optedOut": false, "optedOutAt": null, "otherPhones": [], "personalNote1": "froze han solo in carbinite, he was just a kid!  He's very efficient", "personalNote2": null, "preferredContact": null, "quoraUrl": null, "region": null, "replyCount": 0, "school": null, "score": null, "smsOptStatus": null, "smsOptedAt": null, "source": null, "specialties": null, "stackOverflowId": null, "stackOverflowUrl": null, "tags": ["baddude"], "timeZone": null, "timeZoneIana": null, "timeZoneInferred": null, "title": "vp of assasination", "touchedAt": null, "twitterUrl": null, "twitterUsername": null, "updatedAt": "2018-12-11T15:29:53.000Z", "voipPhones": [], "websiteUrl1": null, "websiteUrl2": null, "websiteUrl3": null, "workPhones": []}, "id": 18, "links": {"self": "https://api.outreach.io/api/v2/prospects/18"}, "relationships": {"account": {"data": {"id": 184796, "type": "account"}}, "calls": {"links": {"related": "https://api.outreach.io/api/v2/calls?filter%5Bprospect%5D%5Bid%5D=18"}}, "creator": {"data": {"id": 1, "type": "user"}}, "mailings": {"links": {"related": "https://api.outreach.io/api/v2/mailings?filter%5Bprospect%5D%5Bid%5D=18"}}, "opportunities": {"data": [], "links": {"related": "https://api.outreach.io/api/v2/opportunities?filter%5Bprospect%5D%5Bid%5D=18"}, "meta": {"count": 0}}, "owner": {"data": {"id": 1, "type": "user"}}, "persona": {"data": null}, "phoneNumbers": {"data": [], "links": {"related": "https://api.outreach.io/api/v2/phoneNumbers?filter%5Bprospect%5D%5Bid%5D=18"}, "meta": {"count": 0}}, "sequenceStates": {"links": {"related": "https://api.outreach.io/api/v2/sequenceStates?filter%5Bprospect%5D%5Bid%5D=18"}}, "stage": {"data": null}, "tasks": {"links": {"related": "https://api.outreach.io/api/v2/tasks?filter%5Bprospect%5D%5Bid%5D=18"}}, "updater": {"data": {"id": 1, "type": "user"}}}, "type": "prospect"}, "type": "Prospect"}],
        ["info", "incoming.user.success", {"request_id": expect.whatever()}, {"data": {"attributes": {"outreach/custom1": {"operation": "set", "value": "probably is a smuggler too"}, "outreach/id": {"operation": "set", "value": 18}, "outreach/personalnote2": {"operation": "set", "value": "froze han solo in carbinite, he was just a kid!  He's very efficient"}}, "ident": {"anonymous_id": "outreach:18", "email": "fettisbest@gmail.com"}}}],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:18", "email": "fettisbest@gmail.com"}, "subjectType": "user"}, {"outreach/custom1": {"operation": "set", "value": "probably is a smuggler too"}, "outreach/id": {"operation": "set", "value": 18}, "outreach/personalnote2": {"operation": "set", "value": "froze han solo in carbinite, he was just a kid!  He's very efficient"}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1],
        ["increment", "service.service_api.errors", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.incoming.users", 1]
      ]
    });
  });
});
