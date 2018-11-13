## A `/notify`  endpoint, `user:update` event

When Hull user is updated Hubspot contact properties should be synced.

```javascript
// deps:
// this.queue

function handleUserUpdate({ user, changes = {}, segments = [] }) {
    return this.shouldSyncUser(user) && this.queue("exportUsersJob", [ user ]);
}
```
