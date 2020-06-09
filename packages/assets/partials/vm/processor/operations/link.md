## How to link Users to Accounts

Now that we know how to deal with users, let’s have a look how to handle accounts.

You can **link an account to the current user** by calling the `hull.account()` function with claims that identify the account. Supported claims are `domain`, `id` and `external_id`. To link an account that is identified by the domain, you would write

```js
hull.account({ domain: <value> })
```
which would either create the account if it doesn’t exist or link the current user to the existing account.

### Limitations

The Platform will ignore store Domains in accounts with a domain being a Generic Email Domain - See the list of email domains we refuse here: https://github.com/smudge/freemail/tree/master/data  - This helps preventing accounts with thousands of users under domains like `gmail.com`.
For instance, `hull.account({ domain: "gmail.com" })` won't add this domain to the Account:

```js
 // Any user with a "gmail.com" account would be linked to this account
 hull.account({ domain: user.domain })
```
