## How to track events

Use the `hull.asUser().track()` function to emit events. Note that there is 10 track call limit per received API call.

Function signature:

```javascript
hull
  .asUser({external_id: <value>})
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
