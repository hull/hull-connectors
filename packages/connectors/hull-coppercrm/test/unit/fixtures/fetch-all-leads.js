module.exports = {
  "configuration": {
    "id": "5d51b4ebc07907e865025a7b",
    "secret": "shhhhhh",
    "organization": "organization.hullapp.io",
    "hostname": "225ddbbc.connector.io",
    "private_settings": {
      "coppercrm_api_key": "b99541216a0cd2af073a5c187f0b44d4",
      "coppercrm_email": "timliuhull@gmail.com",

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
      "link_users_in_service": true,
      "token_expires_in": 7199,
      "token_created_at": 1565635830,
      "refresh_token": "refresh_token",
      "access_token": "access_token",
      "incoming_user_attributes": [
        {
          "hull": "coppercrm/addressstreet",
          "service": "addressStreet"
        }
      ]
    }
  },
  "route": "fetchAllLeads",
  "input": expect.anything(),
  "serviceRequests": [
    {
      "localContext": [
        {}
      ],
      "name": "hull",
      "op": "asUser",
      "input": expect.anything(),
      "result": {}
    },
    {
      "localContext": [
        {}
      ],
      "name": "hull",
      "op": "asUser",
      "input": expect.anything(),
      "result": {}
    }
  ],
  "result": expect.anything()
};
