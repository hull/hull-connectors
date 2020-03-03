# Hull Account Webhooks Connector

The Outgoing Account Webhooks Connector sends a payload to a webhook url on user event occurrences, attribute changes, or segment changes.

#### Getting Started
In the settings page, define your triggers and the url to send payloads to. You have the option to customize the payload
sent in the `Code Editor` section of the connector.

#### Payload Transformation

We provide the option to transform a standard Hull message using the query and transformation language, `JSONata`. If you do
not provide a jsonata transformation, the default Hull message will be sent.

#### Triggers

There are 4 triggers that can be configured:

  1. Account Enters Segment
       
     - Account enters one or more of the whitelisted account segments
       
  2. Account Leaves Segment
     
     - Account leaves one or more of the whitelisted account segments
 
  3. Account Attribute Update
       
     - Account is in one or more of the whitelisted account segments
       
     - A whitelisted account attribute was updated
 
  4. Account is created
       
     - A newly created account is in one or more of the whitelisted account segments

For all segment fields, we provide the option to select 'all_segments'. When selected, the entity can be in any or no 
segments at all.


If a payload matches any of the configured triggers, either the default or customized jsonata payload will be sent to your webhook url:


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
    "user": {},
    "segments": {},
    "account_segments": {
      "left": [
        {
          "id": "account_segment_3",
          "name": "AccountSegment3"
        }
      ],
      "entered": [
        {
          "id": "account_segment_1",
          "name": "AccountSegment1"
        }
      ]
    }
  },
  "user": {},
  "account": {
    "domain": "bar.com",
    "clearbit/name": "The Bar Company"
  },
  "events": [],
  "account_segments": [
    {
      "id": "account_segment_1",
      "name": "AccountSegment1"
    }
  ],
  "segments": [...]
}
```

####  To install:

- Define your triggers
- Provide your webhook url
- Optionally, provide a jsonata expression to manipulate the payload
