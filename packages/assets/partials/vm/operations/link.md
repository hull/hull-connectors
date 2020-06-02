## How to link Users to Accounts

Now that we know how to deal with users, let’s have a look how to handle accounts.

You can **link an account to the current user** by calling the `hull.account` function with claims that identify the account. Supported claims are `domain`, `id` and `external_id`. To link an account that is identified by the domain, you would write

```js
  const claims_object = { domain: <value> }
  hull.account(claims_object)
```
which would either create the account if it doesn’t exist or link the current user to the existing account.
