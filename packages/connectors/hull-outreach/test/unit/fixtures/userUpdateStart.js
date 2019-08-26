module.exports = {
  "configuration": {
    "id": "5d51b4ebc07907e865025a7b",
    "secret": "shhhhhh",
    "organization": "organization.hullapp.io",
    "hostname": "225ddbbc.connector.io",
    "private_settings": {
      "webhook_id": 123,
      "user_claims": [
        {
          "hull": "email",
          "service": "emails"
        }
      ],
      "synchronized_user_segments": [],
      "account_claims": [
        {
          "hull": "domain",
          "service": "domain"
        }
      ],
      "link_users_in_hull": false,
      "synchronized_account_segments": [],
      "outgoing_account_attributes": [
        {
          "hull": "name",
          "service": "name"
        },
        {
          "hull": "closeio/description",
          "service": "description"
        }
      ],
      "link_users_in_service": true,
      "token_expires_in": 7199,
      "token_created_at": 1565635830,
      "refresh_token": "refresh_token",
      "access_token": "access_token",
      "incoming_user_attributes": [
        {
          "hull": "outreach/addressstreet",
          "service": "addressStreet"
        },
        {
          "hull": "outreach/custom1",
          "service": "custom1"
        }
      ],
      "outgoing_user_attributes": [
        {
          "hull": "closeio/title",
          "service": "title"
        }
      ],
      "incoming_account_attributes": [
        {
          "hull": "outreach/custom1",
          "service": "custom1"
        }
      ]
    }
  },
  "route": "userUpdateStart",
  "input": {
    "classType": {
      "service_name": "HullOutgoingUser",
      "name": "User"
    },
    "context": {},
    "data": {
      "user": {
        "id": "5d4933d23c51ff4f520754b3",
        "created_at": "2019-08-06T08:01:22Z",
        "email": "user2@chucksfarm.com",
        "domain": "chucksfarm.com",
        "name": "Chuck Norris",
        "last_name": "Norris",
        "first_name": "Chuck",
        "is_approved": false,
        "anonymous_ids": [
          "hubspot:13401",
          "outreach:184849"
        ],
        "segment_ids": [
          "5d2692246bd734f4f10067dd",
          "5c6b18761d7672a8f21a2f01"
        ],
        "intercom/anonymous": true,
        "intercom/is_lead": true,
        "intercom/lead_user_id": "",
        "intercom/id": "",
        "intercom/user_id": "",
        "starwars/character": "smuggler3",
        "hubspot/lifecycle_stage": "lead",
        "hubspot/became_lead_at": "2019-08-06T07:58:57+00:00",
        "hubspot/hubspot_owner_id": "34096952",
        "hubspot/owner_assigned_at": "2019-08-06T07:58:57+00:00",
        "hubspot/created_at": "2019-08-06T07:58:57+00:00",
        "hubspot/updated_at": "2019-08-06T07:59:02+00:00",
        "hubspot/id": 13401,
        "hubspot/first_name": "Chuck",
        "hubspot/last_name": "Norris",
        "outreach/id": 184849,
        "indexed_at": "2019-08-07T21:25:39Z"
      },
      "segments": [
        {
          "id": "5d2692246bd734f4f10067dd",
          "name": "Users with email",
          "type": "users_segment",
          "created_at": "2019-07-11T01:34:28Z",
          "updated_at": "2019-07-11T01:34:28Z"
        },
        {
          "id": "5c6b18761d7672a8f21a2f01",
          "name": "Send Leads To Intercom",
          "type": "users_segment",
          "created_at": "2019-02-18T20:41:26Z",
          "updated_at": "2019-02-18T20:41:26Z"
        }
      ],
      "account": {}
    }
  },
  "serviceRequests": [
    {
      "localContext": [
        {
          "userId": 184849
        }
      ],
      "name": "outreach",
      "op": "updateProspect",
      "input": {
        "data": {
          "type": "prospect",
          "id": 184849
        }
      },
      "result": {
        "status": 200,
        "text": "{\"data\":{\"type\":\"prospect\",\"id\":184849,\"attributes\":{\"addedAt\":null,\"addressCity\":null,\"addressCountry\":null,\"addressState\":null,\"addressStreet\":null,\"addressStreet2\":null,\"addressZip\":null,\"angelListUrl\":null,\"availableAt\":null,\"callOptedOut\":false,\"callsOptStatus\":null,\"callsOptedAt\":null,\"campaignName\":null,\"clickCount\":0,\"contactHistogram\":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],\"createdAt\":\"2019-08-07T21:24:31.000Z\",\"custom1\":null,\"custom10\":null,\"custom11\":null,\"custom12\":null,\"custom13\":null,\"custom14\":null,\"custom15\":null,\"custom16\":null,\"custom17\":null,\"custom18\":null,\"custom19\":null,\"custom2\":null,\"custom20\":null,\"custom21\":null,\"custom22\":null,\"custom23\":null,\"custom24\":null,\"custom25\":null,\"custom26\":null,\"custom27\":null,\"custom28\":null,\"custom29\":null,\"custom3\":null,\"custom30\":null,\"custom31\":null,\"custom32\":null,\"custom33\":null,\"custom34\":null,\"custom35\":null,\"custom36\":null,\"custom37\":null,\"custom38\":null,\"custom39\":null,\"custom4\":null,\"custom40\":null,\"custom41\":null,\"custom42\":null,\"custom43\":null,\"custom44\":null,\"custom45\":null,\"custom46\":null,\"custom47\":null,\"custom48\":null,\"custom49\":null,\"custom5\":null,\"custom50\":null,\"custom51\":null,\"custom52\":null,\"custom53\":null,\"custom54\":null,\"custom55\":null,\"custom6\":null,\"custom7\":null,\"custom8\":null,\"custom9\":null,\"dateOfBirth\":null,\"degree\":null,\"emailOptedOut\":false,\"emails\":[\"user2@chucksfarm.com\"],\"emailsOptStatus\":null,\"emailsOptedAt\":null,\"engagedAt\":null,\"engagedScore\":0.0,\"eventName\":null,\"externalId\":null,\"externalOwner\":null,\"externalSource\":\"outreach-api\",\"facebookUrl\":null,\"firstName\":null,\"gender\":null,\"githubUrl\":null,\"githubUsername\":null,\"googlePlusUrl\":null,\"graduationDate\":null,\"homePhones\":[],\"jobStartDate\":null,\"lastName\":null,\"linkedInConnections\":null,\"linkedInId\":null,\"linkedInSlug\":null,\"linkedInUrl\":null,\"middleName\":null,\"mobilePhones\":[],\"name\":\"user2@chucksfarm.com\",\"nickname\":null,\"occupation\":null,\"openCount\":0,\"optedOut\":false,\"optedOutAt\":null,\"otherPhones\":[],\"personalNote1\":null,\"personalNote2\":null,\"preferredContact\":null,\"quoraUrl\":null,\"region\":null,\"replyCount\":0,\"school\":null,\"score\":null,\"smsOptStatus\":null,\"smsOptedAt\":null,\"smsOptedOut\":false,\"source\":null,\"specialties\":null,\"stackOverflowId\":null,\"stackOverflowUrl\":null,\"tags\":[],\"timeZone\":null,\"timeZoneIana\":null,\"timeZoneInferred\":null,\"title\":null,\"touchedAt\":null,\"twitterUrl\":null,\"twitterUsername\":null,\"updatedAt\":\"2019-08-07T21:24:31.000Z\",\"voipPhones\":[],\"websiteUrl1\":null,\"websiteUrl2\":null,\"websiteUrl3\":null,\"workPhones\":[]},\"relationships\":{\"account\":{\"data\":{\"type\":\"account\",\"id\":184882}},\"activeSequenceStates\":{\"data\":[],\"links\":{\"related\":\"https://api.outreach.io/api/v2/sequenceStates?filter%5Bprospect%5D%5Bid%5D=184849\"},\"meta\":{\"count\":0}},\"batches\":{\"links\":{\"related\":\"https://api.outreach.io/api/v2/batches?filter%5Bprospect%5D%5Bid%5D=184849\"}},\"calls\":{\"links\":{\"related\":\"https://api.outreach.io/api/v2/calls?filter%5Bprospect%5D%5Bid%5D=184849\"}},\"creator\":{\"data\":{\"type\":\"user\",\"id\":1}},\"defaultPluginMapping\":{\"data\":null},\"emailAddresses\":{\"data\":[{\"type\":\"emailAddress\",\"id\":101}],\"links\":{\"related\":\"https://api.outreach.io/api/v2/emailAddresses?filter%5Bprospect%5D%5Bid%5D=184849\"},\"meta\":{\"count\":1}},\"favorites\":{\"data\":[],\"links\":{\"related\":\"https://api.outreach.io/api/v2/favorites?filter%5Bprospect%5D%5Bid%5D=184849\"},\"meta\":{\"count\":0}},\"mailings\":{\"links\":{\"related\":\"https://api.outreach.io/api/v2/mailings?filter%5Bprospect%5D%5Bid%5D=184849\"}},\"opportunities\":{\"data\":[],\"links\":{\"related\":\"https://api.outreach.io/api/v2/opportunities?filter%5Bprospect%5D%5Bid%5D=184849\"},\"meta\":{\"count\":0}},\"owner\":{\"data\":null},\"persona\":{\"data\":null},\"phoneNumbers\":{\"data\":[],\"links\":{\"related\":\"https://api.outreach.io/api/v2/phoneNumbers?filter%5Bprospect%5D%5Bid%5D=184849\"},\"meta\":{\"count\":0}},\"sequenceStates\":{\"links\":{\"related\":\"https://api.outreach.io/api/v2/sequenceStates?filter%5Bprospect%5D%5Bid%5D=184849\"}},\"stage\":{\"data\":null},\"tasks\":{\"links\":{\"related\":\"https://api.outreach.io/api/v2/tasks?filter%5Bprospect%5D%5Bid%5D=184849\"}},\"updater\":{\"data\":{\"type\":\"user\",\"id\":1}}},\"links\":{\"self\":\"https://api.outreach.io/api/v2/prospects/184849\"}}}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "outreach:184849",
          "email": "user2@chucksfarm.com"
        },
        "attributes": {
          "outreach/id": {
            "value": 184849,
            "operation": "set"
          }
        }
      },
      "result": {}
    }
  ],
  "result": [
    {
      "status": "stop"
    },
    [
      {
        "status": "stop"
      },
      {}
    ]
  ]
};
