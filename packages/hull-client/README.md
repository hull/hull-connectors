# Overview

## In this package:

### [Hull Client](#hull)

A low level Hull Platform API client. Refer to it's documentation for more details

```javascript
const hullClient = new Hull.Client({ configuration });
```

## In the hull-node package (which embeds this one):

### [Hull Middleware](https://github.com/hull/hull-node)

A bridge between Hull Client and a NodeJS HTTP application (e.g. express) which initializes context for every HTTP request:

```javascript
app.use(Hull.Middleware({ configuration }));
```

### [Hull Connector](https://github.com/hull/hull-node)


```javascript
const connector = new Hull.Connector({ configuration });
```

A complete toolkit which is created next to ExpressJS server instance. Includes Hull Middleware and a set of official patterns to build highly scalable and efficient Connectors.

![hull node core components](/docs/assets/hull-node-components.png)

---

# HullClient

This library makes it easy to interact with the Hull API, track Events and set attributes on Users and Accounts.

Creating a new Hull client is pretty straightforward:

`npm install -s hull-client`

```js
const HullClient = require("hull-client");

const hullClient = new HullClient({
  id: "5aafb6ccc32b617846000001",
  secret: "cbo128745o12786345goc12475",
  organization: "xxx.hullapp.io"
});
```

Find all required and optional constructor options in [API REFERENCE](./API.md#hullclient).

## Calling the API

Once you have instantiated a `HullClient`, you can use one of the `get`, `post`,
`put`or `del` methods to perform actions of Hull's [HTTP REST API](https://www.hull.io/docs/references/api/).

```js
// `client.api.get` works too.
const params = {};
hullClient.get(path, params)
  .then(function(response) {
    console.log(response);
  })
  .catch(function(err) {
    console.log(err);
  });
```

The first parameter is the path, the second is the set of parameters you want
to send with the request. They all return Promises so you can use the `.then()` syntax.

Find detailed description of those api methods in [API REFERENCE](./API.md#api).

## Scoping HullClient to User or Account identity

A common use case is to interact with the API identified as a User or Account. To get a scoped HullClient use `asUser` or `asAccount` methods just like below:

```js
// if you have a user id from your database, use the `external_id` field
const user = hullClient.asUser({ external_id: "dkjf565wd654e" });

// if you have a Hull Internal User Id:
const user = hullClient.asUser({ id: "5718b59b7a85ebf20e000169" });
// or just as a string:
const user = hullClient.asUser("5718b59b7a85ebf20e000169");

// Constant `user` is an instance of HullClient, scoped to a specific user
// perform an API call with the user access token
user.get("/me").then((me) => {
  console.log(me);
});

// store attributes on this user identity
user.traits({ foo: "bar "})


// get the access token value
user.token();

// client for an account identified by its domain name
const account = hullClient.asAccount({ domain: 'hull.io' });
account.traits({ name: "Hull inc" });
```

To identify a User, you can use an internal Hull `id`, an ID from your own system of records or database that we call `external_id`, an `email` address or `anonymous_id`. See more examples of picking and using different User claims below.

To identify an account, you can use a Hull `id`, an `external_id` or a `domain`.

Using `asUser` and `asAccount` methods doesn't make an API call, it just returns scoped instance of `HullClient` which comes with additional methods (see [API REFERENCE](./API.md#scopedhullclient)).

The second parameter lets you define additional options (JWT claims) passed to the user resolution script which customize how platform identity resolution mechanism will work (see [API REFERENCE](./API.md#asuser)).

### Examples

> Return a `HullClient` scoped to the user identified by its Hull ID. Not lazily created. Needs an existing User.

```js
hullClient.asUser(userId, { create: false });
```

> Return a `HullClient` scoped to the user identified by its External ID and email. Lazily created if not present before.

```js
hullClient.asUser({ external_id: "dkjf565wd654e" });
```

```js
hullClient.asUser({ email: "user@email.com" });
```

> Return a `HullClient` scoped to the user identified by only by an anonymousId. Lets you start tracking and storing properties from a user before you have a UserID ready for him. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled
> When you have a UserId, just pass both to link them.

```js
hullClient.asUser({ anonymous_id: "44564-EJVWE-1CE56SE-SDVE879VW8D4" });
```

> Return a hull `HullClient` authenticated as the user but with admin privileges

```js
hullClient.asUser({ email: "user@email.com" }, { scopes: ["admin"] });
```

Find detailed description of those claims scoping methods in [API REFERENCE](./API.md#asuser).

## Methods for User or Account scoped instance

```js
const externalId = "dkjf565wd654e";
const anonymousId = "44564-EJVWE-1CE56SE-SDVE879VW8D4";

const user = client.asUser({ external_id: externalId, anonymous_id: anonymousId });
```

When you do this, you get a new client that has a different behaviour. It's now behaving as a User would. It means it does API calls as a user and has new methods to track and store properties

### Tracking User Events

Stores a new event.

```js
const user = hullClient.asUser({ email: "foo@hull.io" });
user.track("new support ticket", {
  messages: 3,
  priority: "high"
}, {
  source: "zendesk",
  type: 'ticket',
  event_id: 'uuid1234' // Pass a unique ID to ensure event de-duplication
  ip: null, // don't store ip - it's a server call
  referer: null, // don't store referer - it's a server call
  created_at: '2013-02-08 09:30:26.123+07:00' // ISO 8601. moment.js does it very well
});
```

Find detailed information about `track` method in [API REFERENCE](./API.md#track).

### Updating User or Account Attributes

Stores Attributes on the user:

```js
user.traits({
  opened_tickets: 12
}, { source: "zendesk" });
// 'source' is optional. Will store the traits grouped under the source name.

// Alternatively, you can send properties for multiple groups with the flat syntax:
user.traits({ "zendesk/opened_tickets": 12, "clearbit/name": "foo" });
```

Find detailed information about `traits` method in [API REFERENCE](./API.md#traits).

## Utils

`HullClient` comes with a set of utilities to simplify working with Hull REST API:

- `util.settings.update` - allows to update only part of connector settings, [see details](./API.md#settingsupdate)
- `util.properties.get` - parse list of attributes stored on organization level, [see details](./API.md#propertiesget)
- `util.traits.group` - allows to transform a flat list of attributes to nested object, [see details](./API.md#traitsgroup)

## Logging

`HullClient` comes with a built-in logger utility exposed as `hullClient.logger`  which emits a standardised output that captures the context of the `HullClient` instance (initial constructor configuration, additional User or Account claims etc.)

The Logger comes in two flavors, `HullClient.logger.xxx` and `hullClient.logger.xxx` - The first one is a generic logger, the second is contextual to the current instance of `HullClient` and captures the ship id organization and current User or Account identifiers.

The Logger is implemented with [Winston](https://github.com/winstonjs/winston). By default it comes with console stdout/stderr transport which will show logs from `info` level.

```js
HullClient.logger.info("message", { object }); // Class logging method,
hullClient.logger.info("message", { object }); // Instance logging method, adds Ship ID and Organization to Context. Use if available.

// Debug works the same way but by default they won't be logged, adjust the log level in following way:
Hull.logger.transports.console.level = "debug";

HullClient.logger.debug("message", { object }); // Class logging method,
hullClient.logger.debug("message", { object });

// You can add more logging destinations like this:
const winstonSlacker = require("winston-slacker");
HullClient.logger.add(winstonSlacker,  { ... });
```

### Logs scoped to specific User or Account

You can also have a user or account scoped logger. Claims used in `asUser` and `asAccount` methods will be added to the log context.

```js
const user = hullClient.asUser({ email: "john@coltrane.com" });
user.logger.info("hello");

// it will produce following log line:
{"context":{"organization":"xxx.hullapp.io","id":"5aafb6ccc32b617846000001","user_email":"john@coltrane.com"},"level":"info","message":"hello"}
```

### Setting a requestId in the logs context

You can decorate all your logs context with a `request_id` which allows you to group all logs related to a particular request or transaction.

This identifier can be passed a `requestId` param at the initialization of the Client.

```js
const client = new Hull({
  organization: "xxx.hullapp.io",
  id: "5aafb6ccc32b617846000001",
  secret: "change-me-please",
  requestId: "123"
});

client.logger.info("hello");
```

will log the following line

```js
{"context":{"organization":"193a8881.hullapp.io","id":"59e99ec13cd60e5c9d000037","request_id":"123"},"level":"info","message":"hello"}
```
