## How to alias / unalias identifiers

You can add or remove anonymous_ids to Users and Accounts  with the following syntax:

```js
hull
  .asUser({ email: "foo@bar.com" })
  .alias({ anonymous_id: "foobar:1234" });
hull
  .asUser({ email: "foo@bar.com" })
  .unalias ({ anonymous_id: "foobar:1234" });

hull
  .asAccount({ domain: "bar.com" })
  .alias({ anonymous_id: "foobar:1234" });
hull
  .asAccount({ domain: "bar.com" })
  .unalias ({ anonymous_id: "foobar:1234" });
```
