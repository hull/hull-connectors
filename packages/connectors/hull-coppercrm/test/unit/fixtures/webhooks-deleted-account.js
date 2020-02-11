module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "person_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "link_person_in_hull": false,
      "account_claims": [
        {
          "hull": "domain",
          "service": "email_domain"
        }
      ],
      "flow_control_user_update_success_size": "100",
      "flow_control_account_update_success_size": "100",
      "activities_to_fetch": [],
      "coppercrm_api_key": "apikeyshhh",
      "coppercrm_email": "timliuhull3@gmail.com",
      "deleteLeadWebhookId": 113343,
      "deletePersonWebhookId": 113344,
      "deleteCompanyWebhookId": 113345,
      "deleteOpportunityWebhookId": 113346
    }
  },
  "route": "webhooks",
  "input": {
    "data": {
      "body": {
        "hullToken": "shhhclientCredentialsEncryptedToken",
        "hullOrganization": "organization.hullapp.io",
        "subscription_id": 113345,
        "event": "delete",
        "type": "company",
        "ids": [
          42428529
        ],
        "updated_attributes": {}
      }
    },
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    }
  },
  "serviceRequests": [
    {
      "localContext": [
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
          "id": 42428529
        }
      ],
      "name": "hull",
      "op": "accountDeletedInService",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm:42428529"
        },
        "attributes": {
          "coppercrm/deleted_at": expect.toBeWithinRange(Date.now(), Date.now() + 5000)
        }
      },
      "result": {}
    }
  ],
  "result": {}
}
