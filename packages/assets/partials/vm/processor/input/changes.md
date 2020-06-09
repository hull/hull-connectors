## Input - Changes

The `changes` object represents all changes to a user that triggered the execution of this processor and contains information about all modified data since the last re-compute of the user. Changes itself is an object in Javascript which exposes the following top-level properties:

- `changes.is_new` indicates whether the <%=entity%> created is new and has just been created or not.
<% if(users) {%>- `changes.segments`, which holds all segments the user has entered and left since the last recompute, accessible via `changes.segments.entered` and `changes.segments.left`. Each segment is an object itself composed of the following properties `created_at` , `id`, `name`, `type`and `updated_at`.
- `changes.user` which is an object that exposes each changed attribute as a property. The property value is an array which has the old value as the first argument and the new one as the second. For example, if the email is set the first time, you can access it via `changes.user.email` and the value will look like this `[null, "test@hull.io"]`.<% } %>
<% if(accounts) {%>- `changes.account_segments`, which holds all account segments the Account has entered and left since the last recompute, accessible via `changes.account_segments.entered` and `changes.account_segments.left`. Each segment is an object itself composed of the following properties `created_at` , `id`, `name`, `type`and `updated_at`.
- `changes.account` which is an object that is exposes each changed attribute as property whose value is an array. The array has the old value as the first argument and the new one as the second. For example, if the email is set the first time, you can access it via `changes.account.domain` and the value will look like this `[null,"www.hull.io"]`<% } %>

The following code shows an example of changes:

```javascript
{
  "changes": {
    "is_new": false,
    <% if(users) { %>
    "segments": {
      "entered": [
        {
          "created_at": "2017-09-01 09:30:22.458Z",
          "id": "dfbdd69d-1e6d-4a58-8031-c721a88f71f6",
          "name": "All Leads",
          "type": "user",
          "updated_at": "2017-09-01 10:04:01.938Z"
        },
        // more segments if applicable
      ],
      "left": [
        // omitted for brevity
      ]
    },
    "user": {
      "newsletter_subscribed": [false, true],
      "first_name": [null, "John"],
      "last_name": [null, "Doe"]
    },
    <% } if(accounts) { %>
    "account_segments": {
      "entered": [
        {
          "created_at": "2017-09-01 09:30:22.458Z",
          "id": "dfbdd69d-1e6d-4a58-8031-c721a88f71f6",
          "name": "All Accounts",
          "type": "account",
          "updated_at": "2017-09-01 10:04:01.938Z"
        },
        // more segments if applicable
      ],
      "left": [
        // omitted for brevity
      ]
    },
    "account": {
      "name": [null, "Hull"],
      "domain": [null, "www.hull.io"],
      "mrr": [null, "500"]
    }
  }
  <% } %>
}
```
