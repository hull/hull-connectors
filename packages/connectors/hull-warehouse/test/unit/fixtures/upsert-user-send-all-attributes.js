const _ = require("lodash");

const events = [
  {
    properties: {
      event_attr: "wow"
    },
    event_id: "123456",
    user_id: "5df8f6f42c6f70000b9d050a",
    event_source: "incoming-webhook",
    app_name: "Front incoming",
    event: "Front message received",
    event_type: "track",
    context: {
      useragent: "Hull Node Client version: 1.1.1",
      referrer: {
        url: null
      },
      days_since_signup: 761,
      ip: "0",
      page: {
        url: null
      }
    },
    anonymous_id: null,
    ship_id: null,
    created_at: "2020-12-17T17:12:33.348Z",
    session_id: null,
    app_id: "456"
  }
];

module.exports = {
  configuration: {
    private_settings: {
      db_username: "abc",
      db_password: "def",
      db_hostname: "ghi",
      db_port: "5432",
      db_name: "test",
      db_account_table_name: "accounts",
      db_user_table_name: "users",
      db_events_table_name: "events",
      outgoing_account_attributes: [],
      send_all_user_attributes: true,
      send_null: false,
      outgoing_user_attributes: [
        { service: "my_email", hull: "email", overwrite: false },
        { service: "dooom", hull: "doom", overwrite: false },
        { service: "salesforce_description", hull: "salesforce/description", overwrite: false },
        { service: "accnt_salesforce_description", hull: "account.salesforce/description", overwrite: false }
      ],
      send_all_account_attributes: false,
      outgoing_user_events: ["Front message received"]
    }
  },
  route: "userUpdate",
  input: [
    {
      user: {
        anonymous_ids: ["outreach:28", "outreach:184792"],
        created_at: "2019-12-17T15:40:36Z",
        email: "bruce@wayneenterprises.com",
        id: "5df8f6f42c6f70000b9d050a",
        indexed_at: "2020-01-08T14:12:36+00:00",
        "outreach/id": 184792,
        doom: true
      },
      segments: [
        {
          created_at: "2019-07-03T12:32:17Z",
          id: "5d1ca0514a24605b7400005d",
          name: "Video Game Characters",
          type: "users_segment",
          updated_at: "2020-01-08T14:12:22Z"
        }
      ],
      message_id: "163c8b9ebe90f9756e80a21f94d53a8f348780fe",
      update_id: "5df9f99b319769000d7b2adf:21:0:0",
      events: _.concat(events, [{ event: "event not mapped" }]),
      changes: {}
    }
  ],
  serviceRequests: [
    {
      name: "postgres",
      op: "upsertHullUser",
      input: {
        user: {
          anonymous_ids: ["outreach:28", "outreach:184792"],
          created_at: "2019-12-17T15:40:36Z",
          email: "bruce@wayneenterprises.com",
          id: "5df8f6f42c6f70000b9d050a",
          indexed_at: "2020-01-08T14:12:36+00:00",
          "outreach/id": 184792,
          doom: true
        },
        segments: [
          {
            created_at: "2019-07-03T12:32:17Z",
            id: "5d1ca0514a24605b7400005d",
            name: "Video Game Characters",
            type: "users_segment",
            updated_at: "2020-01-08T14:12:22Z"
          }
        ],
        message_id: "163c8b9ebe90f9756e80a21f94d53a8f348780fe",
        update_id: "5df9f99b319769000d7b2adf:21:0:0",
        events: _.concat(events, [{ event: "event not mapped" }]),
        changes: {}
      },
      localContext: [
        {
          message: {
            changes: {},
            events: _.concat(events, [{ event: "event not mapped" }]),
            user: {
              anonymous_ids: ["outreach:28", "outreach:184792"],
              created_at: "2019-12-17T15:40:36Z",
              email: "bruce@wayneenterprises.com",
              id: "5df8f6f42c6f70000b9d050a",
              indexed_at: "2020-01-08T14:12:36+00:00",
              "outreach/id": 184792,
              doom: true
            },
            segments: [
              {
                created_at: "2019-07-03T12:32:17Z",
                id: "5d1ca0514a24605b7400005d",
                name: "Video Game Characters",
                type: "users_segment",
                updated_at: "2020-01-08T14:12:22Z"
              }
            ],
            message_id: "163c8b9ebe90f9756e80a21f94d53a8f348780fe",
            update_id: "5df9f99b319769000d7b2adf:21:0:0"
          }
        }
      ]
    }
  ],
  result: expect.anything()
};
