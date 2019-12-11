# Website connector

This connector integrates website with Hull organization.
It allows to track the website traffic and merge it with data coming from other services.
Also it makes data from Hull accessible in the browser, so you can use data coming from other services to personalize the page in realtime.

# Installation

This connector integrates with website through a single HTML tag which enables all features.

Go to connectors settings pane first and whitelist all domains you would like to get traffic and send data back.
For each domain entry we whitelist the domain itself plus all subdomains.

**Example:** whitelisting website.com will also whitelist en.website.com.

# Tracking

Tracking of web traffic is captured by low level library Hull.js.

By default this connector provides basic tracking of pageviews and default identity resolution.

Default page views tracking can be disabled and custom script may be deployed to your website.

Additional customization capabilities are described in [Hull.js reference](https://www.hull.io/docs/reference/hull_js/).
If you need to deploy custom scripts you can use "Additonal scripts" sections of the settings.

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

On a new page load, the `changes` object will be `undefined`. You can rely on it's value to trigger events only on page load.

# Additonal scripts

Website connector allows you to quickly inject additional javascript files and code.
This is especially helpful to integrate front-end libraries of other integrations.

Please check other connectors documentation to see if client-side integration is available.
