module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "incoming_events": ["invitee.created"],
      "webhook_id": "1",
      "receive_events": true,
      "user_claims": [
        { "hull": 'email', "service": 'email' }
      ]
    }
  },
  "route": "webhooks",
  "input": { "body": {
      "created_at": "2020-12-22T18:15:56.000000Z",
      "event": "invitee.created",
      "payload": {
        "cancel_url": "https://calendly.com/cancellations/AHT4VZ5PQYFOSTFB",
        "created_at": "2020-12-22T18:15:55.361675Z",
        "email": "betty@rei.com",
        "event": "https://api.calendly.com/scheduled_events/DDVRNUTABYGF4LO2",
        "name": "Betty",
        "new_invitee": null,
        "old_invitee": null,
        "questions_and_answers": [],
        "reschedule_url": "https://calendly.com/reschedulings/AHT4VZ5PQYFOSTFB",
        "rescheduled": false,
        "status": "active",
        "text_reminder_number": null,
        "timezone": "America/New_York",
        "tracking": {
          "utm_campaign": null,
          "utm_source": null,
          "utm_medium": null,
          "utm_content": null,
          "utm_term": null,
          "salesforce_uuid": null
        },
        "updated_at": "2020-12-22T18:15:55.371482Z",
        "uri": "https://api.calendly.com/scheduled_events/DDVRNUTABYGF4LO2/invitees/AHT4VZ5PQYFOSTFB"
      }
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "events": [
          {
            "eventName": "Invitee Created Event",
            "context": {
              "source": "calendly",
              "created_at": "2020-12-22T18:15:55.371482Z",
              "event_type": "invitee.created",
              "event_id": expect.anything()
            },
            "properties": {
              "cancel_url": "https://calendly.com/cancellations/AHT4VZ5PQYFOSTFB",
              "created_at": "2020-12-22T18:15:55.361675Z",
              "email": "betty@rei.com",
              "event": "https://api.calendly.com/scheduled_events/DDVRNUTABYGF4LO2",
              "name": "Betty",
              "questions_and_answers": [],
              "reschedule_url": "https://calendly.com/reschedulings/AHT4VZ5PQYFOSTFB",
              "rescheduled": false,
              "status": "active",
              "timezone": "America/New_York",
              "event_type": "invitee.created",
              "tracking": {
                "utm_campaign": null,
                "utm_source": null,
                "utm_medium": null,
                "utm_content": null,
                "utm_term": null,
                "salesforce_uuid": null
              },
              "updated_at": "2020-12-22T18:15:55.371482Z",
              "uri": "https://api.calendly.com/scheduled_events/DDVRNUTABYGF4LO2/invitees/AHT4VZ5PQYFOSTFB",
            }
          }
        ],
        "ident": {
          "email": "betty@rei.com"
        },
        "attributes": {
          "name": {
            "operation": "setIfNull",
            "value": "Betty",
          }
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
