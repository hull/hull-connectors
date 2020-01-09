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
      outgoing_user_attributes: [],
      send_all_user_attributes: false,
      outgoing_account_attributes: [
        { service: "my_domain", hull: "domain", overwrite: false },
        { service: "dooom", hull: "doom", overwrite: false }
      ],
      send_all_account_attributes: false
    }
  },
  route: "accountUpdate",
  input: [
    {
      account: {
        anonymous_ids: ["outreach:28", "outreach:184792"],
        created_at: "2019-12-17T15:40:36Z",
        doctype: "account_report",
        domain: "wayneenterprises.com",
        id: "5df8f6f42c6f70000b9d050a",
        indexed_at: "2020-01-08T14:12:36+00:00",
        "outreach/id": 184792
      },
      account_segments: [
        {
          created_at: "2019-07-03T12:32:17Z",
          id: "5d1ca0514a24605b7400005d",
          name: "Video Game Studios",
          type: "accounts_segment",
          updated_at: "2020-01-08T14:12:22Z"
        }
      ],
      message_id: "163c8b9ebe90f9756e80a21f94d53a8f348780fe",
      update_id: "5df9f99b319769000d7b2adf:21:0:0"
    }
  ],
  serviceRequests: [
    {
      name: "postgres",
      op: "upsertHullAccount",
      input: {
        account: {
          id: "5df8f6f42c6f70000b9d050a",
          my_domain: "wayneenterprises.com"
        },
        account_segments: [
          {
            created_at: "2019-07-03T12:32:17Z",
            id: "5d1ca0514a24605b7400005d",
            name: "Video Game Studios",
            type: "accounts_segment",
            updated_at: "2020-01-08T14:12:22Z"
          }
        ]
      },
      localContext: [
        {
          message: {
            account: {
              anonymous_ids: ["outreach:28", "outreach:184792"],
              created_at: "2019-12-17T15:40:36Z",
              doctype: "account_report",
              domain: "wayneenterprises.com",
              id: "5df8f6f42c6f70000b9d050a",
              indexed_at: "2020-01-08T14:12:36+00:00",
              "outreach/id": 184792
            },
            account_segments: [
              {
                created_at: "2019-07-03T12:32:17Z",
                id: "5d1ca0514a24605b7400005d",
                name: "Video Game Studios",
                type: "accounts_segment",
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
  result: [
    [
      undefined
    ]
  ]
};
