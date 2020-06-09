#### Link Users to Accounts

Use the `hull.asUser().account()` function to link users to accounts. Provide the claims, `domain`, `id` and/or `external_id` of the account.

Function signature:

```javascript
hull
  .asUser({external_id: <value>})
  .account({ domain: <value> })
```
