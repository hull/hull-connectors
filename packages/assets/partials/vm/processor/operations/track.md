## How to track events

Now that we know how to handle attributes, let’s have a look at how to **emit events for a user**. You can use the `hull.track` function to emit events, but before we go into further details be aware of the following:

_The `hull.track` call needs to be always enclosed in an `if` statement and we put a limit to maximum 10 tracking calls in one processor. If you do not follow these rules, you could end up with a endless loop of events that counts towards your plan quota._

Here is how to use the function signature:

```js
  hull
    .track( "<event_name>" , {
        PROPERTY_NAME: <value>,
        PROPERTY2_NAME: <value>
      }, {
        ip: "0", //Or the source IP - if present, Event will be geolocated
        created_at: "created_at_timestamp", //Defaults to `now()`
        event_id: "unique_event_id", //To prevent duplication
        referer: "https://referrer.com", //null for Server calls
        source: "calendly", //a namespace such as "zendesk", "mailchimp", "stripe"...
        type: "meeting"
      }
    );
```

The first parameter is a string defining the name of the event while the second parameter is an object that defines the properties of the event.
