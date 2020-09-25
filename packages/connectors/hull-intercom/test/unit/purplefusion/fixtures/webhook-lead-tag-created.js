module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "webhook_id": "1",
      "receive_events": true,
      "lead_claims": [
        { "hull": 'email', "service": 'email' }
      ],
      "incoming_events": [
        'contact.tag.created'
      ]
    }
  },
  "route": "webhooks",
  "input": { "body": {
      "type": "notification_event",
      "app_id": "lkqcyt9t",
      "data": {
        "type": "notification_event_data",
        "item": {
          "type": "contact_tag",
          "contact": {
            "type": "contact",
            "id": "5ee3d479d1cf3dedbee23d68",
            "user_id": "234523452345345",
            "anonymous": false,
            "email": "bob.dylan@rei.com",
            "phone": null,
            "name": "Bob Dylan",
            "pseudonym": null,
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
                  "company_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                  "id": "5f187aa44fd1ce23c1cf25f7",
                  "name": "Sony"
                }
              ]
            },
            "location_data": {},
            "last_request_at": null,
            "created_at": "2020-06-12T19:16:09.076+00:00",
            "remote_created_at": null,
            "signed_up_at": null,
            "updated_at": "2020-08-05T13:14:55.060+00:00",
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
              "tags": [
                {
                  "type": "tag",
                  "id": "4390216"
                }
              ]
            },
            "segments": {
              "type": "segment.list",
              "segments": []
            },
            "custom_attributes": {
              "c_domain": "rei.com",
              "job_title": "software"
            },
            "referrer": null,
            "utm_campaign": null,
            "utm_content": null,
            "utm_medium": null,
            "utm_source": null,
            "utm_term": null,
            "do_not_track": null,
            "last_seen_ip": "123",
            "user_agent_data": null
          },
          "tag": {
            "type": "tag",
            "id": "4399420",
            "name": "NewCompany"
          },
          "created_at": 1596633295,
          "admin": {
            "type": "admin"
          }
        }
      },
      "links": {},
      "id": "notif_16529174-4b01-4df1-bb25-dfd58b979095",
      "topic": "contact.tag.created",
      "delivery_status": "pending",
      "delivery_attempts": 1,
      "delivered_at": 0,
      "first_sent_at": 1596633295,
      "created_at": 1596633294,
      "self": null
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "bob.dylan@rei.com",
          "anonymous_id": "intercom-lead:lead-5ee3d479d1cf3dedbee23d68"
        },
        "events": [
          {
            "context": {
              "created_at": 1596633294,
              "event_id": "5ee3d479d1cf3dedbee23d68-contact.tag.created-1596633294",
              "event_type": "contact_tag",
              "ip": "123",
              "source": "intercom",
            },
            "eventName": "Added Tag",
            "properties": {
              "tag": "NewCompany",
              "topic": "contact.tag.created",
            }
          }
        ]
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
