## Input - Account

The account object consists of a nested trait hierarchy in Hull. This means you can access all traits directly by their name, e.g. to get the name of an account, just use `account.name` in the code.

Accounts do have various identifiers: the Hull ID (`account.id`), an External ID (`account.external_id` ), one or more anonymous_ids in an Array (`account.anonymous_ids`) and Domain (`account.domain`).

The following snippet shows an example of an account:

```javascript
    {
      account: {
        id: "7ad5524d-14ce-41fb-8de4-59ba9ccf130a",
        "anonymous_ids": [
          "intercom:5907854a8ez91d591a49b4c2",
          "hubspot:999999"
          // additional identifiers
        ],
        external_id: "8476c4c7-fe7d-45b1-a30d-cd532621325b",
        domain: "hull.io",
        name: "Hull Inc.",
        clearbit: {
          name: "Hull Inc."
        },
        ... // more attributes in nested hierarchy
      },
      [...] // omitted for clarity
    }
```

Please note that the `external_id` is only present if the account has been created via another connector such as the SQL importer or Segment.
