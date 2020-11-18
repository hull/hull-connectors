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
        'conversation.admin.single.created'
      ]
    }
  },
  "route": "webhooks",
  "input": { "body": {
      "type": "notification_event",
      "app_id": "iynax7cx",
      "data": {
        "type": "notification_event_data",
        "item": {
          "type": "conversation",
          "id": "15494800000000",
          "created_at": 1597106522,
          "updated_at": 1597106522,
          "user": {
            "type": "lead",
            "id": "59e0e10b12ce6cb8f7a30587",
            "user_id": "0e6c4109-c85c-4a47-b2eb-82fa6b39dfd0",
            "name": "john.doe.1@hull.io",
            "email": "john.doe.1@hull.io",
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
            "id": "612553981",
            "url": null,
            "subject": "test",
            "body": "<p>Hi there,</p>",
            "author": {
              "type": "admin",
              "id": "3197195"
            },
            "attachments": []
          },
          "conversation_parts": {
            "type": "conversation_part.list",
            "conversation_parts": [],
            "total_count": 0
          },
          "conversation_rating": {},
          "open": false,
          "state": "closed",
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
            "conversation_web": "https://app.intercom.com/a/apps/iynax7cx/conversations/15494800000000"
          }
        }
      },
      "links": {},
      "id": "notif_4eccb049-b15d-4952-8792-1265013d4b78",
      "topic": "conversation.admin.single.created",
      "delivery_status": "pending",
      "delivery_attempts": 1,
      "delivered_at": 0,
      "first_sent_at": 1597106523,
      "created_at": 1597106522,
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
          "anonymous_id": "intercom-lead:lead-59e0e10b12ce6cb8f7a30587",
          "email": "john.doe.1@hull.io"
        },
        "events": [
          {
            "eventName": "Admin started conversation",
            "context": {
              "source": "intercom",
              "created_at": 1597106522,
              "event_type": "conversation",
              "event_id": "59e0e10b12ce6cb8f7a30587-conversation.admin.single.created-1597106522"
            },
            "properties": {
              "topic": "conversation.admin.single.created",
              "message": "<p>Hi there,</p>",
              "link": "https://app.intercom.com/a/apps/iynax7cx/conversations/15494800000000",
              "assignee_name": "Andy",
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
