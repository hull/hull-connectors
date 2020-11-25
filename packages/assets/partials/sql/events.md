### Events

You can import User Events and associate them to the Users in Hull by providing one of the identifiers. We don't support Account events today.

Valid queries MUST expose an `external_id` column matching a user's `external_id`, an `event` column specifying the event name or type and a `timestamp` column.

Lines with no `external_id`, `event` and `timestamp` will be ignored.

All other fields will be imported as event properties. For example, the following query will map the column `users.id` to your Hull users' `external_id`.

```
SELECT user_id as external_id, event, timestamp FROM users_events
```

If you import User Events, a best practice is to provide an immutable value for the Event's `id` so that events aren't duplicated. We strongly recommend you provide an `event_id` column to ensure event unicity.
