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
        'conversation.admin.unsnoozed'
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
        "type": "conversation",
        "id": "137324500000000",
        "created_at": 1596634805,
        "updated_at": 1596635126,
        "user": {
          "type": "user",
          "id": "5ee3d479d1cf3dedbee23d68",
          "user_id": "234523452345345",
          "name": "Bob Dylan",
          "email": "bob.dylan@rei.com",
          "do_not_track": null
        },
        "assignee": {
          "type": "admin",
          "id": "3330619",
          "name": "Andy",
          "email": "andy@gmail.com"
        },
        "conversation_message": {
          "type": "conversation_message",
          "id": "608953158",
          "url": null,
          "subject": "",
          "body": "<p>Hi Bob</p>",
          "author": {
            "type": "admin",
            "id": "3330619"
          },
          "attachments": []
        },
        "conversation_parts": {
          "type": "conversation_part.list",
          "conversation_parts": [
            {
              "type": "conversation_part",
              "id": "6073794381",
              "part_type": "snoozed",
              "body": null,
              "created_at": 1596635126,
              "updated_at": 1596635126,
              "notified_at": 1596635126,
              "assigned_to": null,
              "author": {
                "type": "admin",
                "id": "3330619",
                "name": "Andy"
              },
              "attachments": [],
              "external_id": null
            }
          ],
          "total_count": 1
        },
        "conversation_rating": {},
        "open": true,
        "state": "snoozed",
        "snoozed_until": 1596645926,
        "read": false,
        "metadata": {},
        "tags": {
          "type": "tag.list",
          "tags": []
        },
        "tags_added": {
          "type": "tag.list",
          "tags": []
        },
        "links": {
          "conversation_web": "https://app.intercom.com/a/apps/lkqcyt9t/conversations/137324500000000"
        }
      }
    },
    "links": {},
    "id": "notif_52e36ca9-d98a-4c77-ad7e-68382b498c80",
    "topic": "conversation.admin.unsnoozed",
    "delivery_status": "pending",
    "delivery_attempts": 1,
    "delivered_at": 0,
    "first_sent_at": 1596635128,
    "created_at": 1596635127
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "intercom-user:user-5ee3d479d1cf3dedbee23d68",
          "email": "bob.dylan@rei.com"
        },
        "events": [
          {
            "eventName": "Admin unsnoozed conversation",
            "context": {
              "source": "intercom",
              "created_at": 1596635127,
              "event_type": "conversation",
              "event_id": "5ee3d479d1cf3dedbee23d68-conversation.admin.unsnoozed-1596635127"
            },
            "properties": {
              "topic": "conversation.admin.unsnoozed",
              "link": "https://app.intercom.com/a/apps/lkqcyt9t/conversations/137324500000000",
              "assignee_name": "Andy",
              "assignee_email": "andy@gmail.com",
              "assignee_id": "3330619"
            }
          }
        ]
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
