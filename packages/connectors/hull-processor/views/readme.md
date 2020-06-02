<% user = true %>
<% account = true %>

# Hull Processor

The Processor enables you to run your own logic on attributes and events associated to users and leads by writing Javascript.

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Processor card. After installation, you will be presented with the three column Dashboard layout. The left column displays the **Input** which is a user with events, segments and attributes, the middle column will hold your Javascript **Code** that transforms it to the **Output** of the right column. The Output itself displays the changed attributes of the user.

![Getting Started Step 1](./docs/gettingstarted01.png)

You can begin writing your own code right away, but you probably might want to gather some useful background information first. We recommend to start with the [execution model](#Execution-Model) which clarifies when your code is run before you move on to the data that is available as Input:

- [User](#Input---User)
- [Changes](#Input---Changes)
- [Account](#Input---Accounts)
- [Events](#Input---Events)
- [User Segments](#Input---User-Segments)
- [Account Segments](#Input---Account-Segments)

Read more about writing code:

- [Code basics](#Code-basics)
- [External libraries](#External-Libraries)
- [Golden Rules](#Golden-Rules)


## Features

The Hull Processor allows your team to write Javascript and transform data in Hull for users and accounts. You can emit events based of attribute changes or calculate a lead score, the Processor is your multi-tool when it comes to data in Hull.

The Processor can  `add traits`,  `update traits` and `create events` for both, users and accounts. Furthermore it allows you to `link accounts` And add/remove `aliases` for users

<%- include ../../../assets/partials/vm/features.md %>

<%- include ../../../assets/partials/vm/execution-model.md %>

<%- include ../../../assets/partials/vm/input/user.md %>

<%- include ../../../assets/partials/vm/input/changes.md %>

<%- include ../../../assets/partials/vm/input/account.md %>

<%- include ../../../assets/partials/vm/input/events.md %>

<%- include ../../../assets/partials/vm/input/segments/user.md %>

<%- include ../../../assets/partials/vm/input/segments/account.md %>

<%- include ../../../assets/partials/vm/input/shape.md %>

## How to set User / Account attributes

Lets first explore how you can **change attributes for a user**. As you already know from the Input - User section above, there are three types of attributes, top-level, ungrouped and grouped attributes. ***Top-level and ungrouped attributes*** can be set with the not-overloaded function call

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value> })
```

For naming conventions, see the Golden Rules section below.

Of course you can set multiple attributes at once by passing a more complex object like:

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

Using this function signature, these attributes are stored at the top level for the target User (or Account)

### Attribute Groups

If you want to make use of ***grouped attributes***, you can use the overloaded signature of the function, passing the group name as source in the second parameter:

```javascript
  hull.traits({ bar: "baz" }, { source: "foo" })
```

Alternatively, you can pass the fully qualified name for the grouped attribute. Those two signatures will have the same results

```javascript
  hull.traits({ "foo/bar": baz });
```

If you want to “delete” an attribute, you can use the same function calls as described above and simply set `null`  as value.

```javascript
  hull.traits({ foo: null });
```

<%- include ../../../assets/partials/vm/input/atomic.md %>

## How to track events

Now that we know how to handle attributes, let’s have a look at how to **emit events for a user**. You can use the `hull.track` function to emit events, but before we go into further details be aware of the following:

_The `hull.track` call needs to be always enclosed in an `if` statement and we put a limit to maximum 10 tracking calls in one processor. If you do not follow these rules, you could end up with a endless loop of events that counts towards your plan quota._

Here is how to use the function signature:

```js
  hull.track( "<event_name>" , { PROPERTY_NAME: <value>, PROPERTY2_NAME: <value> })
```

The first parameter is a string defining the name of the event while the second parameter is an object that defines the properties of the event.


<%- include ../../../assets/partials/vm/operations/alias.md %>

<%- include ../../../assets/partials/vm/operations/link.md %>

<%- include ../../../assets/partials/vm/operations/linked-account.md %>

<%- include ../../../assets/partials/vm/limitations.md %>


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
User1 Update
  → Set MRR=100
    → Account Update
      → User2 Update
        → Set MRR=200
          → Account Update
            → User Update
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

<%- include ../../../assets/partials/vm/utility.md %>

<%- include ../../../assets/partials/vm/libs.md %>

<%- include ../../../assets/partials/vm/golden-rules.md %>

<%- include ../../../assets/partials/vm/debugging-logging.md %>
