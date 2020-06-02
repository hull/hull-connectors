### Limitations

The Platform refuses to associate Users in accounts with a domain being a Generic Email Domain - See the list of email domains we refuse here: https://github.com/smudge/freemail/tree/master/data  - This helps preventing accounts with thousands of users under domains like `gmail.com` because you'd have written the following code:

```js
 // Any user with a "gmail.com" account would be linked to this account
 hull.account({ domain: user.domain })
```
