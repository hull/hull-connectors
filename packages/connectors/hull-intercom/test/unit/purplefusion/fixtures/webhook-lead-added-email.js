module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "lead_claims": [
        { "hull": 'email', "service": 'email' }
      ],
      "incoming_events": [
        'conversation.user.created',
        'conversation.user.replied',
        'contact.added_email'
      ]
    }
  },
  "route": "webhooks",
  "input": {
    "type": "notification_event",
    "app_id": "lkqcyt9t",
    "data": {
      "type": "notification_event_data",
      "item": {
        "type": "contact",
        "id": "5f161b7a332231fc10b44e5f",
        "user_id": null,
        "anonymous": true,
        "email": "lead@rei.com",
        "phone": null,
        "name": "Liza Lead",
        "pseudonym": "Pink Squirrel",
        "avatar": {
          "type": "avatar",
          "image_url": null
        },
        "app_id": "lkqcyt9t",
        "companies": {
          "type": "company.list",
          "companies": [
            {
              "type": "company",
              "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
              "id": "5f161ef9ce73f3ea2605304e",
              "name": "REI"
            }
          ]
        },
        "location_data": {},
        "last_request_at": null,
        "created_at": "2020-07-20T22:32:26.965+00:00",
        "remote_created_at": null,
        "signed_up_at": null,
        "updated_at": "2020-08-04T15:28:27.349+00:00",
        "session_count": 0,
        "social_profiles": {
          "type": "social_profile.list",
          "social_profiles": []
        },
        "owner_id": null,
        "unsubscribed_from_emails": false,
        "marked_email_as_spam": false,
        "has_hard_bounced": false,
        "tags": {
          "type": "tag.list",
          "tags": []
        },
        "segments": {
          "type": "segment.list",
          "segments": []
        },
        "custom_attributes": {
          "job_title": "software ....."
        },
        "referrer": null,
        "utm_campaign": null,
        "utm_content": null,
        "utm_medium": null,
        "utm_source": null,
        "utm_term": null,
        "do_not_track": null,
        "last_seen_ip": 123,
        "user_agent_data": null
      }
    },
    "links": {},
    "id": "notif_f6e78f58-9d91-416e-9603-a6ce6407ff2f",
    "topic": "contact.added_email",
    "delivery_status": "pending",
    "delivery_attempts": 1,
    "delivered_at": 0,
    "first_sent_at": 1596554907,
    "created_at": 1596554907,
    "self": null
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "lead@rei.com",
          "anonymous_id": "intercom-lead:lead-5f161b7a332231fc10b44e5f"
        },
        "events": [
          {
            "eventName": "Updated email address",
            "properties": {
              "email": "lead@rei.com",
              "topic": "contact.added_email"
            },
            "context": {
              "ip": 123,
              "event_type": "contact",
              "source": "intercom",
              "event_id": "5f161b7a332231fc10b44e5f-contact.added_email-1596554907",
              "created_at": 1596554907
            }
          }
        ]
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
