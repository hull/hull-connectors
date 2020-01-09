# Hull Website

## Personalization technical docs (former Browser connector)

**IMPORTANT:** At some point we had experimental browser connector, which we merged with new website connector replacing platforms feature. The documentation below applies to the former browser connector, which is now part of website connector.

# Installing

Sends Hull customer data back in the page, so you can use it for personalization, segmentation and ad targeting.

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-browser)

---

### Using :

[See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-browser.herokuapp.com)

### Developement setup :

```sh
git clone git@github.com:hull-ships/hull-browser.git
cd hull-browser
yarn
yarn dev # Serves connector on `https://hull-browser.eu.ngrok.io` - See `package.json`
yarn build # builds the app
```

#### Note

Connector will be primed on each User notification or Ship Update.
Which means if you just rebooted, and do a page view before server has sent an update, it will be skipped.
Keep this in mind when developing

### How it works

When a User hits a webpage with the snippet, the snippet will attempt to establish a websocket connection to the connector backend.
If the domain is authorized, we will let it pass. Once this is done, the client searches for a set of identifiers in the page, from Segment.com, Hull and Intercom.
It forwards this to the backend, which subscribes the browser to all valid Identifiers (`ID`, `external ID` and `anonymous IDs`) as socket IO Rooms.

When the user is updated (with Fast lane this should happen in a few seconds), Hull will send an update to the connector,
which in turn will broadcast it to all the Rooms with that user's `ID`, `external ID` and `anonymous IDs`

### Logged events

Here are the events that the Browser connector tracks

- `outgoing.user.fetch.error` - An error happened when a browser asked for info about a user
- `incoming.connection.start` - Started Socket.io connection
- `incoming.connection.error` - Failed establishing connection. see error message
- `incoming.connection.success` - Established connection successfully
- `incoming.user.join-channel` - Joined `channel` (any User ID we have available)
- `incoming.user.fetch.success` - Success fetching a user
- `incoming.user.fetch.error` - Error while searching for a User
- `incoming.user.start` - We received a User Update, attempt to send it to all rooms
- `incoming.user.fetch.start` - Started fetching user data from a `Hull ID` (we have one after first succcessful connection)
- `outgoing.user.success` - Success in sending the user update to rooms.

# Environment variables

```sh
SECRET="A randomly created secret. Make it long and complex"
REDIS_URL="Redis connection URI"
```


On Heroku, don't forget to setup Session Affinity to have users always hit the same node.
It's not mandatory since we use Redis behind the scenes for a LRU and a Config cache, but it's always cleaner.


https://devcenter.heroku.com/articles/session-affinity
https://socket.io/docs/using-multiple-nodes/


## Personalization settings sections

If we need to enable part of settings related to personalization we need to paste this section in the manifest:

```json
{
  "title": "Personalization",
  "description": "This section allows to personalize content on of the website based on data send back from Hull as we detect changes on identified user.<br /> - start by enabling the feature toggle<br /> - define conditions for a user to be sent client-side, by whitelisting some segments<br /> - select which data will be visible client-side. That way you can avoid exposing sensitive values. <br /> - finally write the code which will run in the page whenever new data is sent client-side. We suggest checking the documentation to see the available data and the connector's behaviour",
  "properties": [
    "private_settings.subscribe_to_user_updates",
    "private_settings.synchronized_segments",
    "private_settings.public_traits",
    "private_settings.public_segments",
    "private_settings.public_account_segments",
    "settings.script"
  ]
}
```

## Personalization documentation

**From top section:**

Also it makes data from Hull accessible in the browser, so you can use data coming from other services to personalize the page in realtime.

# Personalization

## Getting Started

To use it:

1. Whitelist the web pages from which this connector should be allowed to launch.
1. In the Settings tab, choose which users will be forwarded by selecting one or more segments
2. Choose which attributes and segment names will be accessible client-side.
3. Paste the snippet in the page
4. In the Settings tab, write some javascript that will be run whenever the user is updated.

The Script will have access to an object `user` and an object `segments` with the following shapes:

```javascript
console.log(
  user, /* ...whitelisted User properties */
  segments, /* whitelisted user segments */
  account, /* ...whitelisted account properties */
  account_segments, /* whitelisted account segments */
  events, /* whitelisted events */
  changes /* changes since last update */
);
```

We encourage you to write the script so that it can run multiple times without side effects (Be Idempotent). Users will come in multiple times.

Let's say you want to tag the User with a custom Facebook Event for each segment they belong to and the name of their company.
You'd then write:

```js
segments.map(function(segment) {
  fbq('trackCustom', 'In Segment '+segment, {
    metrics_raised: user.clearbit_company.metrics_raised
  });
});
```

## Listening to events

Alternatively, you can subscribe to an event emitter that will emit a new event every time we receive updated data from the server.

```js
Hull.on("user.update", function({
  user,
  segments,
  account,
  account_segments,
  events,
  changes
}) {

}));
```

We use https://github.com/EventEmitter2/EventEmitter2 so you can read it's documentation to view the full set of possibilities

## Running code on data changed:

The `changes` object will return the values that changed between the previous update and the current one.
Since Hull works somewhat like an Event Loop, the first payload you will receive might not have all the enrichments from other connectors. Subsequent payloads could contain more data. The Changes object will tell you what changed.

The `changes` object has the following format:

```js
var changes = {
  user: {
    foo: [previous_value, new_value]
  },
  account: {
    bar: [previous_value, new_value]
  }
}
```

## Running code only on page load:

If an existing user was found in Hull for discovered identifiers, on a new page load, the `changes` object will be `undefined`. You can rely on it's value to trigger events only on page load.

# Additonal scripts

Website connector allows you to quickly inject additional javascript files and code.
This is especially helpful to integrate front-end libraries of other integrations.

Please check other connectors documentation to see if client-side integration is available.
