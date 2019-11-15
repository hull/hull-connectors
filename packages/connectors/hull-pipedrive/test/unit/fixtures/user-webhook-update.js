module.exports = {
  route: "webhooks",
  configuration: {
    private_settings: {
      "link_users_in_hull": true,
      "user_claims": [
        {
          "service": "email",
          "hull": "email"
        }
      ],
      "incoming_user_attributes": [
        {
          "hull": "name",
          "service": "name"
        },
        {
          "hull": "somephone",
          "service": "phone"
        }
      ],
    }
  },
  input: {
    body: {
      "v": 1,
      "matches_filters": {
        "current": [],
        "previous": []
      },
      "meta": {
        "v": 1,
        "action": "added",
        "object": "person",
        "id": "someid",
        "company_id": "companyid",
        "user_id": "user_id",
        "type": "general",
        "host": "company.pipedrive.com",
        "timestamp": 1523440213,
        "timestamp_micro": 1523440213384700,
        "permitted_user_ids": [],
        "trans_pending": false,
        "is_bulk_update": false,
        "pipedrive_service_name": false,
        "matches_filters": {
          "current": [],
          "previous": []
        },
        "webhook_id": "webhook_id"
      },
      "retry": 0,
      "current": {
        "id": 1,
        "company_id": 7072556,
        "owner_id": {
          "id": 10638921,
          "name": "Tim",
          "email": "tim@hull.io",
          "has_pic": false,
          "pic_hash": null,
          "active_flag": true,
          "value": 10638921
        },
        "org_id": {
          "name": "TheCo",
          "people_count": 1,
          "owner_id": 10638921,
          "address": null,
          "active_flag": true,
          "cc_email": "timshull-79d985@pipedrivemail.com",
          "value": 1
        },
        "name": "Tim",
        "first_name": "Tim",
        "last_name": null,
        "open_deals_count": 0,
        "related_open_deals_count": 0,
        "closed_deals_count": 0,
        "related_closed_deals_count": 0,
        "participant_open_deals_count": 0,
        "participant_closed_deals_count": 0,
        "email_messages_count": 0,
        "activities_count": 0,
        "done_activities_count": 0,
        "undone_activities_count": 0,
        "reference_activities_count": 0,
        "files_count": 0,
        "notes_count": 0,
        "followers_count": 1,
        "won_deals_count": 0,
        "related_won_deals_count": 0,
        "lost_deals_count": 0,
        "related_lost_deals_count": 0,
        "active_flag": true,
        "phone": [
          {
            "label": "work",
            "value": "5553452345",
            "primary": true
          }
        ],
        "email": [
          {
            "label": "work",
            "value": "timmy@theco.com",
            "primary": true
          }
        ],
        "first_char": "t",
        "update_time": "2019-09-25 18:50:01",
        "add_time": "2019-09-25 18:50:00",
        "visible_to": "3",
        "picture_id": null,
        "next_activity_date": null,
        "next_activity_time": null,
        "next_activity_id": null,
        "last_activity_id": null,
        "last_activity_date": null,
        "last_incoming_mail_time": null,
        "last_outgoing_mail_time": null,
        "label": 2,
        "org_name": "TheCo",
        "owner_name": "Tim",
        "cc_email": "timshull-79d985@pipedrivemail.com"
      },
    "event": "Updated something"
    }
  },
  result: expect.anything(),
  serviceRequests: [
    {
      localContext:expect.anything(),
      input: {
        "accountAttributes": {
          "pipedrive/id": 1
        },
        "accountIdent": {
          "anonymous_id": "pipedrive:1"
        },
        "attributes": {
          "name": {
            "operation": "set",
            "value": "Tim"
          },
          "pipedrive/id": {
            "operation": "set",
            "value": 1
          },
          "somephone": {
            "operation": "set",
            "value": "5553452345"
          }
        },
        "ident": {
          "anonymous_id": "pipedrive:1",
          "email": "timmy@theco.com"
        }
      },
      name: "hull",
      op: "asUser",
      result: {}
    }
  ]
};
