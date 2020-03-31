# Hull User Webhooks Connector

The Outgoing User Webhooks Connector sends a payload to a webhook url on user event occurrences, attribute changes, or segment changes.

#### Getting Started
In the settings page, define your triggers and the url to send payloads to. You have the option to customize the payload
sent in the `Code Editor` section of the connector.

#### Payload Transformation

We provide the option to transform a standard Hull message using the query and transformation language, `JSONata`. If you do
not provide a jsonata transformation, the default Hull message will be sent.

#### Triggers

There are 5 triggers that can be configured:

 1. User Enters Segment
    
    - User enters one or more of the whitelisted user segments

 2. User Leaves Segment
    
    - User leaves one or more of the whitelisted user segments
    
 3. User Attribute Updated
    
    - User is in one or more of the whitelisted user segments
      
    - A whitelisted user attribute was updated
   
 4. User Event Created
     
    - User is in one or more of the whitelisted user segments
      
    - Event name matches an event on the user

 5. User is created
      
    - A newly created user is in one or more of the whitelisted user segments

For all segment fields, we provide the option to select 'all_segments'. When selected, the entity can be in any or no 
segments at all.


If a payload matches any of the configured triggers, either the default or customized jsonata payload will be sent to your webhook url.


A payload will consist of these elements:
```js
{
  "user": "The entire user profile with all attributes",
  "account": "The entire account associated with the user with all it's attributes",
  "segments": "Every segment the user belongs to, as objects containing unique segment ids",
  "account_segments": "Every segment the account belongs to",
  "changes": "Every change that caused this user or account to be recomputed",
  "events": "The event that triggered the send, if any" // optional
}
```

----
Example Payload
```json
{
  "changes": {
    "is_new": false,
    "account": {},
    "user": {
      "clearbit/employment_role": ["", "ceo"]
    },
    "account_segments": {},
    "segments": {
      "left": [
        {
          "id": "user_segment_3",
          "name": "UserSegment3"
        }
      ],
      "entered": [
        {
          "id": "user_segment_1",
          "name": "UserSegment1"
        }
      ]
    }
  },
  "user": {
     "email": "foo@bar.com",
     "user_id": "user_id_1",
    ...
    "clearbit/employment_role": "ceo"
  },
  "account": {
    "domain": "bar.com",
    "clearbit/name": "The Bar Company"
  },
  "events": [
    {
      "event": "Email Opened",
      "event_id": "123456789",
      "user_id": "user_id_1",
      "created_at": "2019-07-18T20:19:33Z",
      "properties": {
        "emailCampaignId": "123456",
        "created": "1563746708853"
      },
      "event_source": "hubspot",
      "context": {}
    }
  ],
  "segments": [
    {
      "id": "user_segment_1",
      "name": "UserSegment1"
    }
  ],
  "account_segments": [...]
}
```

### Manual extract

As an addition to ongoing updates, a manual push to the connector can be triggered using "Send to" button on Hull dashboard. It will send selected users to the connector. In this case, there are no changes or events on the user profile and only the segment filter will be applied to decide which users are sent out.

### Rate limiting

The Outgoing Webhooks Connector allows you to adjust rate limit at which each webhook endpoint will be called. To make that possible we expose two settings: `Requests rate limit` and `Requests concurrency`:

- `Requests rate limit` is the maximum number of requests done every 1 second
- `Requests concurrency` will limit the number of maximum concurrent requests the connector will open

> E.g. if you define concurrency of 2, first two requests will be fired immediately and the 3rd one will be only run after completion of any of first two.

### Webhook receiver endpoint must respond with 2xx status code

The connector expects the webhook endpoint to respond with 200-204 status codes to treat it as a successful request. Otherwise it will mark the outgoing event as `outgoing.account.error`

### Connector doesn't support redirects

The connector does not follow redirect responses such us 301, 302 etc. Those redirects are treated as errors. To make sure that the connector works smoothly, ensure that all of the urls provided in the settings are the final, resolved url addresses.

> E.g. if your final url is `https://www.webhook-url.com/endpoint/` do not use `http://webhook-url.com/endpoint` - watch out for missing `https`, `www` and trailing slash. If any of those parts are missing it may lead to redirect and cause connector to error out

### 10 requests needs to fit in 25 seconds time window

Due to our internal batching and timeouts levels we need to make sure that the connector can process 10 users in time below ~20 seconds. E.g. if the connector is set with concurrency of 1, the slowest webhook endpoint needs to respond in less than ~2 seconds to be able to finish all 10 users before our timeout will interrupt the data flow.

####  To install:

- Define your triggers
- Provide your webhook url
- Optionally, provide a jsonata expression to manipulate the payload
