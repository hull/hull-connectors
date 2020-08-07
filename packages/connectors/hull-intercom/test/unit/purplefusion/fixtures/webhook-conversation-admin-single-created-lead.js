module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "user_claims": [
        { "hull": 'email', "service": 'email' }
      ],
      "incoming_events": [
        'conversation.admin.single.created'
      ]
    }
  },
  "route": "webhooks",
  "input": {},
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {},
      "result": {}
    }
  ],
  "result": expect.anything()
}
