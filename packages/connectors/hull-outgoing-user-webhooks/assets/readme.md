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

####  To install:

- Define your triggers
- Provide your webhook url
- Optionally, provide a jsonata expression to manipulate the payload
