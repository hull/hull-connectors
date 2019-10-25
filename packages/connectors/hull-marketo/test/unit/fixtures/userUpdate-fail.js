module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "user_claims": [
        {
          "service": "email",
          "hull": "email"
        }
      ],
      "synchronized_user_segments": [
        "5d03f0d5ef68e25a1100beab"
      ],
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
        }
      ],
      "link_users_in_service": false,
      "marketo_client_id": "clientid",
      "marketo_client_secret": "clientsecret",
      "marketo_authorized_user": "hull@hull.io",
      "marketo_identity_url": "https://www.mktorest.com/identity",
      "pollLeadExportInterval": null,
      "leadExportId": "null",
      "access_token": "access_token",
      "expires_in": 3599,
      "scope": "hull@hull.io",
      "incoming_user_attributes": [],
      "latestLeadSync": 1566935686642,
      "outgoing_user_attributes": [
        {
          "hull": "unified_data/title",
          "service": "title"
        },
        {
          "hull": "unified_data/firstname",
          "service": "firstName"
        },
        {
          "hull": "unified_data/weakness",
          "service": "mktoPersonNotes"
        },
        {
          "hull": "unified_data/shirt_color",
          "service": "title"
        }
      ],
      "fetch_all_attributes": true,
      "fetch_events": false,
      "flow_control_user_update_success_size": "100"
    }
  },
  "route": "userUpdate",
  "input": {
    "data": [
      {
        "user": {
          "id": "5d03f071f6a893b3a300962e",
          "created_at": "2019-06-14T19:07:29Z",
          "email": "linus@peanuts.com",
          "domain": "peanuts.com",
          "is_approved": false,
          "anonymous_ids": [
            "marketo:6993811"
          ],
          "segment_ids": [
            "5d03f0d5ef68e25a1100beab"
          ],
          "marketo/id": "6993811",
          "marketo/firstname": "Linus",
          "marketo/companyname": "Unknown",
          "marketo/jobtitle": "red",
          "unified_data/weakness": "blanket",
          "unified_data/shirt_color": "red",
          "unified_data/title": "herosfriend",
          "unified_data/firstname": "Linus",
          "indexed_at": "2019-06-23T16:36:09Z"
        },
        "segments": [
          {
            "id": "5d03f0d5ef68e25a1100beab",
            "name": "Peanuts Test",
            "type": "users_segment",
            "created_at": "2019-06-14T19:09:09Z",
            "updated_at": "2019-06-14T19:09:09Z"
          }
        ],
        "account": {}
      }
    ],
    "classType": {
      "service_name": "HullOutgoingUser",
      "name": "User"
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "marketo",
      "op": "upsertLeads",
      "input": {
        "action": "createOrUpdate",
        "asyncProcessing": true,
        "lookupField": "email",
        "input": [{
          "title": "red",
          "firstName": "Linus",
          "mktoPersonNotes": "blanket",
          "email": "linus@peanuts.com"
        }]
      },
      "result": {
        "status": 200,
        "text": "{\"requestId\":\"f069#16cd4a61823\",\"success\":false,\"errors\":[{\"code\":\"602\",\"message\":\"Access token expired\"}]}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "marketo",
      "op": "getAuthenticationToken",
      "result": {
        "status": 200,
        "text": "{\"access_token\":\"newaccesstoken:sj\",\"token_type\":\"bearer\",\"expires_in\":3599,\"scope\":\"hull@hull.io\"}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "settingsUpdate",
      "input": {
        "access_token": "newaccesstoken:sj",
        "expires_in": 3599,
        "scope": "hull@hull.io"
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "marketo",
      "op": "upsertLeads",
      "input": {
        "action": "createOrUpdate",
        "asyncProcessing": true,
        "lookupField": "email",
        "input": [{
          "title": "red",
          "firstName": "Linus",
          "mktoPersonNotes": "blanket",
          "email": "linus@peanuts.com"
        }]
      },
      "result": {
        "status": 200,
        "text": "{\"requestId\":\"16405#16cd4a61f12\",\"success\":false,\"errors\":[{\"code\":\"609\",\"message\":\"Invalid value specified for attribute 'input'\"}]}"
      }
    }
  ],
  "error": expect.objectContaining({
    message: "There is an issue with the way that the connector is interfacing with Marketo.  Please check the marketo status page to check if the api is having issues, or contact your Hull support representative (Marketo Error Details: [609]: Invalid value specified for attribute 'input')"
  })
};
