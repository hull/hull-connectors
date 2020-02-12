module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "flow_control_user_update_success_size": "100",
      "activities_to_fetch": [],
      "coppercrm_api_key": "apikeyshhh",
      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "coppercrm_email": "timliuhull3@gmail.com",
      "flow_control_account_update_success_size": "100",
      "account_claims": [
        {
          "hull": "domain",
          "service": "email_domain"
        }
      ],
      "person_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "link_person_in_hull": false
    }
  },
  "route": "shipUpdate",
  "input": {
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getAllWebhooks",
      "result": {
        "status": 200,
        "body": [
          {
            "id": 113339,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "lead",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990438
          },
          {
            "id": 113340,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "person",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990439
          },
          {
            "id": 113341,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "company",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990440
          },
          {
            "id": 113342,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "opportunity",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990441
          }
        ]
      }
    },
    {
      "localContext": expect.objectContaining(
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
          "webhook": {
            "id": 113339,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "lead",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990438
          }
        }
      ),
      "name": "coppercrm",
      "op": "deleteWebhook",
      "result": {
        "status": 200,
        "text": "{\"id\":113339}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "createWebhook",
      "input": {
        "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
        "secret": {
          "hullToken": "shhhclientCredentialsEncryptedToken",
          "hullOrganization": "organization.hullapp.io"
        },
        "type": "lead",
        "event": "delete"
      },
      "result": {
        "status": 200,
        "text": "{\"id\":113343,\"target\":\"https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken\",\"type\":\"lead\",\"event\":\"delete\",\"secret\":{\"hullToken\":\"shhhclientCredentialsEncryptedToken\",\"hullOrganization\":\"organization.hullapp.io\"},\"created_at\":1577990570}"
      }
    },
    {
      "localContext": expect.objectContaining(
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
          "webhook": {
            "id": 113340,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "person",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990439
          },
          "deleteLeadWebhook": {
            "id": 113343,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "lead",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990570
          },
          "settingsWebhookIds": {
            "deleteLeadWebhookId": 113343
          }
        }
      ),
      "name": "coppercrm",
      "op": "deleteWebhook",
      "result": {
        "status": 200,
        "text": "{\"id\":113340}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "createWebhook",
      "input": {
        "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
        "secret": {
          "hullToken": "shhhclientCredentialsEncryptedToken",
          "hullOrganization": "organization.hullapp.io"
        },
        "type": "person",
        "event": "delete"
      },
      "result": {
        "status": 200,
        "text": "{\"id\":113344,\"target\":\"https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken\",\"type\":\"person\",\"event\":\"delete\",\"secret\":{\"hullToken\":\"shhhclientCredentialsEncryptedToken\",\"hullOrganization\":\"organization.hullapp.io\"},\"created_at\":1577990571}"
      }
    },
    {
      "localContext": expect.objectContaining(
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
          "webhook": {
            "id": 113341,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "company",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990440
          },
          "deleteLeadWebhook": {
            "id": 113343,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "lead",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990570
          },
          "settingsWebhookIds": {
            "deleteLeadWebhookId": 113343,
            "deletePersonWebhookId": 113344
          },
          "deletePersonWebhook": {
            "id": 113344,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "person",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990571
          }
        }
      ),
      "name": "coppercrm",
      "op": "deleteWebhook",
      "result": {
        "status": 200,
        "text": "{\"id\":113341}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "createWebhook",
      "input": {
        "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
        "secret": {
          "hullToken": "shhhclientCredentialsEncryptedToken",
          "hullOrganization": "organization.hullapp.io"
        },
        "type": "company",
        "event": "delete"
      },
      "result": {
        "status": 200,
        "text": "{\"id\":113345,\"target\":\"https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken\",\"type\":\"company\",\"event\":\"delete\",\"secret\":{\"hullToken\":\"shhhclientCredentialsEncryptedToken\",\"hullOrganization\":\"organization.hullapp.io\"},\"created_at\":1577990572}"
      }
    },
    {
      "localContext": expect.objectContaining(
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
          "webhook": {
            "id": 113342,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "opportunity",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990441
          },
          "deleteLeadWebhook": {
            "id": 113343,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "lead",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990570
          },
          "settingsWebhookIds": {
            "deleteLeadWebhookId": 113343,
            "deletePersonWebhookId": 113344,
            "deleteCompanyWebhookId": 113345
          },
          "deletePersonWebhook": {
            "id": 113344,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "person",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990571
          },
          "deleteCompanyWebhook": {
            "id": 113345,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "company",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990572
          }
        }
      ),
      "name": "coppercrm",
      "op": "deleteWebhook",
      "result": {
        "status": 200,
        "text": "{\"id\":113342}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "createWebhook",
      "input": {
        "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
        "secret": {
          "hullToken": "shhhclientCredentialsEncryptedToken",
          "hullOrganization": "organization.hullapp.io"
        },
        "type": "opportunity",
        "event": "delete"
      },
      "result": {
        "status": 200,
        "text": "{\"id\":113346,\"target\":\"https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken\",\"type\":\"opportunity\",\"event\":\"delete\",\"secret\":{\"hullToken\":\"shhhclientCredentialsEncryptedToken\",\"hullOrganization\":\"organization.hullapp.io\"},\"created_at\":1577990573}"
      }
    },
    {
      "localContext": expect.objectContaining(
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
          "webhook": {
            "id": 113342,
            "target": "https://connectortest.connectordomain.io/webhooks?hull_token=oldtoken",
            "type": "opportunity",
            "event": "delete",
            "secret": {
              "hullToken": "oldtoken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990441
          },
          "deleteLeadWebhook": {
            "id": 113343,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "lead",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990570
          },
          "settingsWebhookIds": {
            "deleteLeadWebhookId": 113343,
            "deletePersonWebhookId": 113344,
            "deleteCompanyWebhookId": 113345,
            "deleteOpportunityWebhookId": 113346
          },
          "deletePersonWebhook": {
            "id": 113344,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "person",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990571
          },
          "deleteCompanyWebhook": {
            "id": 113345,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "company",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990572
          },
          "deleteOpportunityWebhook": {
            "id": 113346,
            "target": "https://connectortest.connectordomain.io/webhooks?hullToken=shhhclientCredentialsEncryptedToken",
            "type": "opportunity",
            "event": "delete",
            "secret": {
              "hullToken": "shhhclientCredentialsEncryptedToken",
              "hullOrganization": "organization.hullapp.io"
            },
            "created_at": 1577990573
          }
        }
      ),
      "name": "hull",
      "op": "settingsUpdate",
      "input": {
        "deleteLeadWebhookId": 113343,
        "deletePersonWebhookId": 113344,
        "deleteCompanyWebhookId": 113345,
        "deleteOpportunityWebhookId": 113346
      },
      "result": expect.anything()
    }
  ],
  "result": {}
}
