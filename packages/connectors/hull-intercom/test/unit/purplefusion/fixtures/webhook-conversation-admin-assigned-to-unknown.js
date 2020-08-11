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
        'conversation.admin.assigned'
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
        "updated_at": 1596635008,
        "user": {
          "type": "user",
          "id": "5ee3d479d1cf3dedbee23d68",
          "user_id": "234523452345345",
          "name": "Bob Dylan",
          "email": "bob.dylan@rei.com",
          "do_not_track": null
        },
        "assignee": {
          "type": "nobody_admin",
          "id": null
        },
        "conversation_message": {
          "type": "conversation_message",
          "id": "608953158",
          "url": null,
          "subject": "",
          "body": "<p>hi Bob</p>",
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
              "id": "6073773149",
              "part_type": "assignment",
              "body": null,
              "created_at": 1596635008,
              "updated_at": 1596635008,
              "notified_at": 1596635008,
              "assigned_to": {
                "type": "admin",
                "id": "3330619",
                "name": "Andy"
              },
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
        "state": "open",
        "snoozed_until": null,
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
    "id": "notif_193c5c58-eec2-4bb6-88da-62c9db80a994",
    "topic": "conversation.admin.assigned",
    "delivery_status": "pending",
    "delivery_attempts": 1,
    "delivered_at": 0,
    "first_sent_at": 1596635010,
    "created_at": 1596635010,
    "self": null
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
            "eventName": "Admin assigned conversation",
            "context": {
              "source": "intercom",
              "created_at": 1596635010,
              "event_type": "conversation",
              "event_id": "5ee3d479d1cf3dedbee23d68-conversation.admin.assigned-1596635010"
            },
            "props": {
              "topic": "conversation.admin.assigned",
              "link": "https://app.intercom.com/a/apps/lkqcyt9t/conversations/137324500000000",
              "to": "5ee3d479d1cf3dedbee23d68",
              "initiated": "nobody_admin"
            }
          }
        ]
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
