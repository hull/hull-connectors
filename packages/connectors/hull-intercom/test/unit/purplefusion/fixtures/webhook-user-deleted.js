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
      "user_claims": [
        { "hull": 'email', "service": 'email' },
        { "hull": 'external_id', "service": 'external_id' }
      ],
      "incoming_events": [
        'conversation.user.created',
        'conversation.user.replied',
        'user.deleted'
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
  "input": { "body": {
      "type": "notification_event",
      "app_id": "lkqcyt9t",
      "data": {
        "type": "notification_event_data",
        "item": {
          "type": "user",
          "id": "5ee3d479d1cf3dedbee23d68",
          "user_id": "234523452345345",
          "email": "bob.dylan@rei.com"
        }
      },
      "links": {},
      "id": "notif_ff77ab17-14b0-462d-a37e-1afe2defc6ad",
      "topic": "user.deleted",
      "delivery_status": "pending",
      "delivery_attempts": 1,
      "delivered_at": 0,
      "first_sent_at": 1596662517,
      "created_at": 1596662517,
      "self": null
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "userDeletedInService",
      "input": {
        "ident": {
          "anonymous_id": "intercom-user:user-5ee3d479d1cf3dedbee23d68"
        },
        "attributes": { "intercom_user/deleted_at": 1596662517 }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
