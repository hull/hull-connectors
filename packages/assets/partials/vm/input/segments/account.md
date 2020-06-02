## Input - Account Segments

You can access the segments for the Account a user belongs to via `account_segments` which is an array of objects itself. Each segment object has an identifier and name that can be accessed via `id` and `name` and metadata such as `type`, `updated_at` and `created_at`.

The following code shows an example of the `account_segments` data:

```javascript
    {
      "account_segments": [
        {
          "id": "59b14b212fa9835d5d004825",
          "name": "Approved users",
          "type": "users_segment",
          "updated_at": "2017-09-07T13:35:29Z",
          "created_at": "2017-09-07T13:35:29Z"
        },
        {
          "id": "5995ce9f38b35ffd2100ecf4",
          "name": "Leads",
          "type": "users_segment",
          "updated_at": "2017-08-17T17:13:03Z",
          "created_at": "2017-08-17T17:13:03Z"
        },
        // additional segments
      ]
    }
```
