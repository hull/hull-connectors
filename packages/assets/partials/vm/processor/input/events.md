## Input - Events

The `events` object holds all events that have occurred since the last re-compute of the user. It is an array of objects, that has a couple of key attributes as explained below. You shouldn’t rely on the fact that these attributes are present for every event.

The `event.event` attribute holds the name of the event itself while `event.event_source` and `event.event_type` provide you some information where the event came from and what type the event is of. The `event.context` property provides you data about the environment of the event, such as the url, session and timestamp. The `event.properties`  of the event provide you access to all attributes of the event. Both, `event.context`  and `event.properties`, depend heavily on the event, so you should code defensively when accessing this data.

The following code shows an example payload of events:

```javascript
    {
      "events": [
        {
          "event": "Viewed ships",
          "created_at": "2017-09-18T12:18:04Z",
          "properties": {
            "action": "PUSH"
          },
          "event_source": "track",
          "event_type": "track",
          "context": {
            "location": {
              "latitude": 99,
              "longitude": 99
            },
            "page": {
              "url": "https://dashboard.hullapp.io/super/ships"
            }
          }
        }
      ]
    }
```
