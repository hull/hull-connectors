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
      "incoming_lead_attributes": [
        { "service": "external_id", "hull": "intercom_lead/user_id", "readOnly": true, "overwrite": true },
        { "service": "id", "hull": "intercom_lead/id", "readOnly": true, "overwrite": true },
        { "service": "email", "hull": "intercom_lead/email", "readOnly": true, "overwrite": true },
        { "service": "avatar", "hull": "intercom_lead/avatar", "overwrite": true },
        { "service": "browser", "hull": "intercom_lead/browser", "overwrite": true },
        { "service": "browser_language", "hull": "intercom_lead/browser_language", "overwrite": true },
        { "service": "browser_version", "hull": "intercom_lead/browser_version", "overwrite": true },
        { "service": "companies", "hull": "intercom_lead/c_companies", "overwrite": true },
        { "service": "created_at", "hull": "intercom_lead/created_at", "overwrite": true },
        { "service": "has_hard_bounced", "hull": "intercom_lead/has_hard_bounced", "overwrite": true },
        { "service": "language_override", "hull": "intercom_lead/language_override", "overwrite": true },
        { "service": "last_contacted_at", "hull": "intercom_lead/last_contacted_at", "overwrite": true },
        { "service": "last_email_clicked_at", "hull": "intercom_lead/last_email_clicked_at", "overwrite": true },
        { "service": "last_email_opened_at", "hull": "intercom_lead/last_email_opened_at", "overwrite": true },
        { "service": "last_replied_at", "hull": "intercom_lead/last_replied_at", "overwrite": true },
        { "service": "last_seen_at", "hull": "intercom_lead/last_seen_at", "overwrite": true },
        { "service": "location.city", "hull": "intercom_lead/location_city_name", "overwrite": true },
        { "service": "location.country", "hull": "intercom_lead/location_country_name", "overwrite": true },
        { "service": "location.region", "hull": "intercom_lead/location_region_name", "overwrite": true },
        { "service": "marked_email_as_spam", "hull": "intercom_lead/marked_email_as_spam", "overwrite": true },
        { "service": "name", "hull": "intercom_lead/name", "overwrite": true },
        { "service": "os", "hull": "intercom_lead/os", "overwrite": true },
        { "service": "owner_id", "hull": "intercom_lead/owner_id", "overwrite": true },
        { "service": "phone", "hull": "intercom_lead/phone", "overwrite": true },
        { "service": "segments", "hull": "intercom_lead/c_segments", "overwrite": true },
        { "service": "signed_up_at", "hull": "intercom_lead/signed_up_at", "overwrite": true },
        { "service": "social_profiles", "hull": "intercom_lead/c_social_profiles", "overwrite": true },
        { "service": "tags", "hull": "intercom_lead/c_tags", "overwrite": true },
        { "service": "unsubscribed_from_emails", "hull": "intercom_lead/unsubscribed_from_emails", "overwrite": true },
        { "service": "updated_at", "hull": "intercom_lead/updated_at", "overwrite": true },
        { "service": 'custom_attributes.job_title', "hull": 'intercom_lead/job_title', "overwrite": true  },
        { "service": 'custom_attributes.c_domain', "hull": 'intercom_lead/duplicate_domain', "overwrite": true }
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
        "type": "contact_tag",
        "created_at": 1596634036,
        "tag": {
          "type": "tag",
          "id": "4406229",
          "name": "Tag2"
        },
        "contact": {
          "type": "contact",
          "id": "5f161b7a332231fc10b44e5f",
          "user_id": null,
          "anonymous": true,
          "email": "lizalead_3@rei.com",
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
          "updated_at": "2020-08-05T13:27:16.491+00:00",
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
                "id": "4406230"
              },
              {
                "type": "tag",
                "id": "4406236"
              },
              {
                "type": "tag",
                "id": "4406235"
              },
              {
                "type": "tag",
                "id": "4406234"
              },
              {
                "type": "tag",
                "id": "4406233"
              },
              {
                "type": "tag",
                "id": "4406239"
              },
              {
                "type": "tag",
                "id": "4406238"
              },
              {
                "type": "tag",
                "id": "4406237"
              },
              {
                "type": "tag",
                "id": "4406232"
              },
              {
                "type": "tag",
                "id": "4406231"
              },
              {
                "type": "tag",
                "id": "4391517"
              },
              {
                "type": "tag",
                "id": "4406240"
              }
            ]
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
          "last_seen_ip": null,
          "user_agent_data": null
        }
      }
    },
    "links": {},
    "id": "notif_9cd383ab-d6c5-4b6a-ab22-a83464c44f20",
    "topic": "contact.tag.deleted",
    "delivery_status": "pending",
    "delivery_attempts": 1,
    "delivered_at": 0,
    "first_sent_at": 1596634036,
    "created_at": 1596634036,
    "self": null
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "intercom",
      "op": "getContactSegments",
      "result": {
        "body": {
            "type": "list",
            "data": [
              {
                "type": "segment",
                "id": "5d2640faa76403cb13d73c2f",
                "name": "Segment1",
                "created_at": 1562788090,
                "updated_at": 1595788749,
                "person_type": "lead"
              },
              {
                "type": "segment",
                "id": "5dd30458939b587add11f1aa",
                "name": "Segment2",
                "created_at": 1574110296,
                "updated_at": 1595795580,
                "person_type": "lead"
              }
            ]
          }
      }
    },
    {
      "localContext": expect.anything(),
      "name": "intercom",
      "op": "getContactTags",
      "result": {
        "body": {
            "type": "list",
            "data": [
              { "type": "tag", "id": "4406234", "name": "Tag1" },
              { "type": "tag", "id": "4406229", "name": "Tag2" }
            ]
          }
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "lizalead_3@rei.com",
          "anonymous_id": "intercom-lead:lead-5f161b7a332231fc10b44e5f"
        },
        "attributes": {
          "intercom_lead/user_id": {
            "operation": "set",
            "value": null
          },
          "intercom_lead/id": {
            "value": "5f161b7a332231fc10b44e5f",
            "operation": "set"
          },
          "intercom_lead/email": {
            "operation": "set",
            "value": "lizalead_3@rei.com"
          },
          "intercom_lead/avatar": {
            "operation": "set",
            "value": null
          },
          "intercom_lead/created_at": {
            "operation": "set",
            "value": 1595284347
          },
          "intercom_lead/has_hard_bounced": {
            "operation": "set",
            "value": false
          },
          "intercom_lead/owner_id": {
            "operation": "set",
            "value": null
          },
          "intercom_lead/phone": {
            "operation": "set",
            "value": null
          },
          "intercom_lead/signed_up_at": {
            "operation": "set",
            "value": null
          },
          "intercom_lead/updated_at": {
            "operation": "set",
            "value": 1596634037,
          },
          "intercom_lead/job_title": {
            "operation": "set",
            "value": "software ....."
          },
          "intercom_lead/c_companies": {
            "value": [
              "REI"
            ],
            "operation": "set"
          },
          "intercom_lead/c_segments": {
            "value": [
              "Segment1",
              "Segment2"
            ],
            "operation": "set"
          },
          "intercom_lead/c_social_profiles": {
            "operation": "set",
            "value": [

            ]
          },
          "intercom_lead/c_tags": {
            "value": [
              "Tag1",
              "Tag2"
            ],
            "operation": "set"
          }
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
