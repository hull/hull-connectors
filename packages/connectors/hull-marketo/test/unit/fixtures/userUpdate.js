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
      "access_token": "access_token",
      "expires_in": 3599,
      "scope": "hull@hull.io",
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
      },
      {
        "user": {
          "id": "5d03f044f6a893f9ee0095fc",
          "created_at": "2019-06-14T19:06:44Z",
          "email": "charlie@peanuts.com",
          "domain": "peanuts.com",
          "is_approved": false,
          "anonymous_ids": [
            "marketo:6993812"
          ],
          "segment_ids": [
            "5d03f0d5ef68e25a1100beab"
          ],
          "marketo/id": "6993812",
          "marketo/firstname": "Charlie",
          "marketo/lastname": "Estimator",
          "marketo/companyname": "Unknown",
          "marketo/jobtitle": "yellow",
          "unified_data/weakness": "kicking footballs",
          "unified_data/shirt_color": "yellow",
          "unified_data/title": "hero",
          "unified_data/firstname": "Charlie",
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
        "input": [
          {
            "title": "red",
            "firstName": "Linus",
            "mktoPersonNotes": "blanket",
            "email": "linus@peanuts.com"
          },
          {
            "title": "yellow",
            "firstName": "Charlie",
            "mktoPersonNotes": "kicking footballs",
            "email": "charlie@peanuts.com"
          }
        ]
      },
      "result": {
        "status": 200,
        "text": "{\"requestId\":\"15ed4#16cd4e0cf84\",\"result\":[{\"id\":6993811,\"status\":\"updated\"},{\"id\":6993812,\"status\":\"updated\"}],\"success\":true}"
      }
    }
  ],
  "result": expect.anything()
}
