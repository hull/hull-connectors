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
      "incoming_user_attributes": [
        { "service": "external_id", "hull": "intercom_user/user_id", "readOnly": true, "overwrite": true },
        { "service": "id", "hull": "intercom_user/id", "readOnly": true, "overwrite": true },
        { "service": "email", "hull": "intercom_user/email", "readOnly": true, "overwrite": true },
        { "service": "avatar", "hull": "intercom_user/avatar", "overwrite": true },
        { "service": "browser", "hull": "intercom_user/browser", "overwrite": true },
        { "service": "browser_language", "hull": "intercom_user/browser_language", "overwrite": true },
        { "service": "browser_version", "hull": "intercom_user/browser_version", "overwrite": true },
        { "service": "companies", "hull": "intercom_user/c_companies", "overwrite": true },
        { "service": "created_at", "hull": "intercom_user/created_at", "overwrite": true },
        { "service": "has_hard_bounced", "hull": "intercom_user/has_hard_bounced", "overwrite": true },
        { "service": "language_override", "hull": "intercom_user/language_override", "overwrite": true },
        { "service": "last_contacted_at", "hull": "intercom_user/last_contacted_at", "overwrite": true },
        { "service": "last_email_clicked_at", "hull": "intercom_user/last_email_clicked_at", "overwrite": true },
        { "service": "last_email_opened_at", "hull": "intercom_user/last_email_opened_at", "overwrite": true },
        { "service": "last_replied_at", "hull": "intercom_user/last_replied_at", "overwrite": true },
        { "service": "last_seen_at", "hull": "intercom_user/last_seen_at", "overwrite": true },
        { "service": "location.city", "hull": "intercom_user/location_city_name", "overwrite": true },
        { "service": "location.country", "hull": "intercom_user/location_country_name", "overwrite": true },
        { "service": "location.region", "hull": "intercom_user/location_region_name", "overwrite": true },
        { "service": "marked_email_as_spam", "hull": "intercom_user/marked_email_as_spam", "overwrite": true },
        { "service": "name", "hull": "intercom_user/name", "overwrite": true },
        { "service": "os", "hull": "intercom_user/os", "overwrite": true },
        { "service": "owner_id", "hull": "intercom_user/owner_id", "overwrite": true },
        { "service": "phone", "hull": "intercom_user/phone", "overwrite": true },
        { "service": "segments", "hull": "intercom_user/c_segments", "overwrite": true },
        { "service": "signed_up_at", "hull": "intercom_user/signed_up_at", "overwrite": true },
        { "service": "social_profiles", "hull": "intercom_user/c_social_profiles", "overwrite": true },
        { "service": "tags", "hull": "intercom_user/c_tags", "overwrite": true },
        { "service": "unsubscribed_from_emails", "hull": "intercom_user/unsubscribed_from_emails", "overwrite": true },
        { "service": "updated_at", "hull": "intercom_user/updated_at", "overwrite": true },
        { "service": 'custom_attributes.job_title', "hull": 'intercom_user/job_title', "overwrite": true  },
        { "service": 'custom_attributes.c_domain', "hull": 'intercom_user/duplicate_domain', "overwrite": true }
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
        "type": "user_tag",
        "user": {
          "type": "user",
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
          "updated_at": "2020-08-05T13:24:40.258+00:00",
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
              },
              {
                "type": "tag",
                "id": "4390215"
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
          "last_seen_ip": null,
          "user_agent_data": null
        },
        "tag": {
          "type": "tag",
          "id": "4399420",
          "name": "NewCompany"
        },
        "created_at": 1596633880,
        "admin": {
          "type": "admin"
        }
      }
    },
    "links": {},
    "id": "notif_31345d83-849c-4894-8996-62f302034077",
    "topic": "user.tag.deleted",
    "delivery_status": "pending",
    "delivery_attempts": 1,
    "delivered_at": 0,
    "first_sent_at": 1596633880,
    "created_at": 1596633880,
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
              "person_type": "user"
            },
            {
              "type": "segment",
              "id": "5dd30458939b587add11f1aa",
              "name": "Segment2",
              "created_at": 1574110296,
              "updated_at": 1595795580,
              "person_type": "user"
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
          "email": "bob.dylan@rei.com",
          "anonymous_id": "intercom-user:user-5ee3d479d1cf3dedbee23d68"
        },
        "attributes": {
          "intercom_user/user_id": {
            "operation": "set",
            "value": "234523452345345"
          },
          "intercom_user/id": {
            "value": "5ee3d479d1cf3dedbee23d68",
            "operation": "set"
          },
          "intercom_user/email": {
            "operation": "set",
            "value": "bob.dylan@rei.com"
          },
          "intercom_user/avatar": {
            "operation": "set",
            "value": null
          },
          "intercom_user/created_at": {
            "operation": "set",
            "value": 1591989370
          },
          "intercom_user/has_hard_bounced": {
            "operation": "set",
            "value": false
          },
          "intercom_user/owner_id": {
            "operation": "set",
            "value": null
          },
          "intercom_user/phone": {
            "operation": "set",
            "value": null
          },
          "intercom_user/signed_up_at": {
            "operation": "set",
            "value": null
          },
          "intercom_user/updated_at": {
            "operation": "set",
            "value": 1596633881
          },
          "intercom_user/job_title": {
            "operation": "set",
            "value": "software"
          },
          "intercom_user/duplicate_domain": {
            "operation": "set",
            "value": "rei.com"
          },
          "intercom_user/c_companies": {
            "value": [
              "Sony"
            ],
            "operation": "set"
          },
          "intercom_user/c_segments": {
            "value": [
              "Segment1",
              "Segment2"
            ],
            "operation": "set"
          },
          "intercom_user/c_social_profiles": {
            "operation": "set",
            "value": [

            ]
          },
          "intercom_user/c_tags": {
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
