<% connector_name = "Account Processor" %>
<% entity = "User" %>
<% users = true %>
<% accounts = true %>
# Hull Processor

The <%=connector_name%> enables you to run your own logic on attributes and events associated to users and leads by writing Javascript.

<%- include("../../../assets/partials/install.md"); %>

After installation, click the `Code Editor` button. You will be presented with the three column Dashboard layout. The left column displays the **Input** which is a user with events, segments and attributes, the middle column will hold your Javascript **Code** that transforms it to the **Output** of the right column. The Output itself displays the changed attributes of the user.

<%- include("../../../assets/partials/vm/getting-started.md"); %>

<%- include("../../../assets/partials/vm/processor/features.md"); %>

<%- include("../../../assets/partials/vm/execution-model.md"); %>
- The Processor receives events exactly once, or in other words the exposed events are the ones between now and the last run of the Processor.

<%- include("../../../assets/partials/vm/processor/input/user.md"); %>

<%- include("../../../assets/partials/vm/processor/input/changes.md"); %>

<%- include("../../../assets/partials/vm/processor/input/account.md"); %>

<%- include("../../../assets/partials/vm/processor/input/events.md"); %>

<%- include("../../../assets/partials/vm/processor/input/segments/user.md"); %>

<%- include("../../../assets/partials/vm/processor/input/segments/account.md"); %>

<%- include("../../../assets/partials/vm/processor/code-basics.md"); %>

<%- include("../../../assets/partials/vm/processor/operations/traits.md"); %>

<%- include("../../../assets/partials/vm/processor/operations/atomic.md"); %>

<%- include("../../../assets/partials/vm/processor/operations/track.md"); %>

<%- include("../../../assets/partials/vm/processor/operations/alias.md"); %>

<%- include("../../../assets/partials/vm/processor/operations/link.md"); %>

<%- include("../../../assets/partials/vm/processor/operations/linked-account.md"); %>

### Understanding the logic behind Accounts, Preventing Infinite Loops

Let's review a particularly critical part of Accounts:

Here's a scenario that, although it seems intuitive, will **generate an infinite loop** (which is bad. You don't want that). Let's say you store the MRR of the account at the User level and want to use Hull to store it at account level. Intuitively, you'd do this:

```js
hull
  .account(CLAIMS_OBJECT) //target the user's current account
  .traits({
    //set the value of the 'is_customer' attribute to the user's value
    mrr: user.traits.mrr
  })
```

Unfortunately, it's enough for 2 users in this account to have different data to have the account go into an infinite loop:

```
User 1 Update
  → Set MRR=100
    → Account Update
      → User 2 Update
        → Set MRR=200
          → Account Update
            → User 1 Update
              → Set MRR=100 → Account Update
etc...
```

The way you solve this is by either doing a `setIfNull` operation on the account, so that the first user with a value defines the value for the account and it's not updated anymore, or you rely on the `changes` object to only change the Account when the value for the user changed:

```js
const mrr = _.get(changes, 'user.traits.mrr')
//There was an MRR change on the User
if(mrr && mrr[1]) {
  //report the new MRR on the Account
  hull.account(CLAIMS_OBJECT).traits({ mrr: mrr[1] });
}
```

Or you could rely on a User Event if you have such events"

```js
events.map(event => {
  if (event.event === "MRR Changed") {
    hull.account(CLAIMS_OBJECT).traits({ mrr: event.properties.mrr });
  }
});
```

<%- include("../../../assets/partials/vm/utility.md"); %>

<%- include("../../../assets/partials/vm/libs.md"); %>

<%- include("../../../assets/partials/vm/variables.md"); %>

<%- include("../../../assets/partials/vm/golden-rules.md"); %>

<%- include("../../../assets/partials/vm/debugging-logging.md"); %>
