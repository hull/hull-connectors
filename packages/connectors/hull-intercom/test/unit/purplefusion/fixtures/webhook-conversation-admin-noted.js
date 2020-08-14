module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "webhook_id": "1",
      "user_claims": [
        { "hull": 'email', "service": 'email' }
      ],
      "incoming_events": [
        'conversation.admin.noted'
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
          "type": "conversation",
          "id": "137324500000000",
          "created_at": 1596634805,
          "updated_at": 1596635094,
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
                "id": "6073788584",
                "part_type": "note",
                "body": "<p>this is a note</p>",
                "created_at": 1596635094,
                "updated_at": 1596635094,
                "notified_at": 1596635094,
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
      "id": "notif_34a83d84-960d-4825-b3c0-78bb90b207f2",
      "topic": "conversation.admin.noted",
      "delivery_status": "pending",
      "delivery_attempts": 1,
      "delivered_at": 0,
      "first_sent_at": 1596635096,
      "created_at": 1596635095,
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
          "anonymous_id": "intercom-user:user-5ee3d479d1cf3dedbee23d68",
          "email": "bob.dylan@rei.com"
        },
        "events": [
          {
            "eventName": "Admin added note to conversation",
            "context": {
              "source": "intercom",
              "created_at": 1596635095,
              "event_type": "conversation",
              "event_id": "5ee3d479d1cf3dedbee23d68-conversation.admin.noted-1596635095"
            },
            "properties": {
              "topic": "conversation.admin.noted",
              "note": "<p>this is a note</p>",
              "link": "https://app.intercom.com/a/apps/lkqcyt9t/conversations/137324500000000",
              "assignee_name": "Andy",
              "author": "Andy",
              "assignee_email": "andy@gmail.com",
              "assignee_id": "3330619",
              "initiated": "admin"
            }
          }
        ]
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}
