# Hull Zapier Connector

The Zapier Connector enables more automated workflows that leverage Hull's central source of information to seamlessly 
communicate with other applications and data sources.

#### Getting Started
In Hull, install the Zapier Connector and copy the generated authentication token. In Zapier, 
install the Zapier app 'Hull'. After creating a Hull zap and choosing a trigger, paste the authentication
token when prompted.

#### Zap Triggers

There are 9 triggers that can be configured:

 1. User Enters Segment
    
    - User enters one or more of the whitelisted user segments
    
      - User can enter any segment if the global _all_segments_ is defined

 2. User Leaves Segment
    
    - User leaves one or more of the whitelisted user segments
    
      - User can leave any segment if the global _all_segments_ is defined
    
 3. User Attribute Updated
    
    - User is in one or more of the whitelisted user segments
    
      - User can be in any or no segments if the global _all_segments_ is defined

    - Account on the user is in one or more of the whitelisted account segments
        
      - Account can be in any or no segments if the global _all_segments_ is defined
      
    - A whitelisted user attribute was updated or a whitelisted account (on the user) 
    attribute was updated
   
 4. User Event Created
     
    - User is in one or more of the whitelisted user segments
      
      - User can be in any or no segments if the global _all_segments_ is defined
      
    - Account on the user is in one or more of the whitelisted account segments
    
      - Account can be in any or no segments if the global _all_segments_ is defined
      
    - Event name matches an event on the user

 5. Account Enters Segment
      
    - Account enters one or more of the whitelisted account segments
    
      - Account can enter any segment if the global _all_segments_ is defined
      
 6. Account Leaves Segment
    
    - Account leaves one or more of the whitelisted user segments
        
      - Account can leave any segment if the global _all_segments_ is defined

 7. Account Attribute Update
      
    - Account is in one or more of the whitelisted user segments
    
      - Account can be in any or no segments if the global _all_segments_ is defined
      
    - A whitelisted account attribute was updated

 8. User is created
      
    - A newly created user is in one or more of the whitelisted user segments
    
      - User can be in any or no segments if the global _all_segments_ is defined

 9. Account is created
      
    - A newly created account is in one or more of the whitelisted account segments
    
      - Account can be in any or no segments if the global _all_segments_ is defined
      
If a payload matches any of the configured triggers, the full object will be sent to the Zap(s)

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
    ...
    "clearbit/employment_role": "ceo"
  },
  "account": {
    "domain": "bar.com",
    "clearbit/name": "The Bar Company"
  },
  "event": {
    "event": "Viewed a page"
  },
  "segments": [
    {
      "id": "user_segment_1",
      "name": "UserSegment1"
    }
  ],
  "account_segments": [...]
}
```

### Zap Actions

There are 4 Actions that can be taken:

1. Create/Update User
   
   - Provide the external id and/or the email

2. Create/Update Account
   
   - Provide the external id and/or the domain
   
3. Search User
   
   - Provide the external id and/or the email

4. Search Account
   
   - Provide the external id and/or the domain

####  To install:

- In Hull, click the "Connect to Zapier" button on the Dashboard page,
- In Zapier, authorize with the access token from the Connector Settings page.
