# Intercom Connector

The Intercom Connector enables your sales team to engage with leads 
and helps your support team stay in touch with customers by integrating 
your Intercom data with other data sources.

##
### Migrate From the Intercom Legacy Connector

The legacy Intercom connector was built off of the Intercom API version 1.0.
The current version of the connector was built to support
the latest Intercom API version, 2.x.

##### Breaking changes between the API versions:

1) In API version 2.x, the Users API & Leads API are deprecated and replaced with the Contacts API.
As a result, the following fields are no longer retrievable via the API:
    ```
      anonymous
      pseudonym
      session_count
      referrer
      utm_campaign
      utm_content
      utm_medium
      utm_source
      utm_term
      postal_code
      timezone
      continent_code
      country_code
      user_agent_data
      latitude
      longitude
      last_seen_ip
    ```

2) The Contact field `user_id` is now `external_id`.

##### Breaking changes between the Connector versions:

1) Enhanced support for Users and Leads

    - Users and leads are treated as distinct entities within a single Hull user. User attributes
    will be written to the `intercom_user/` attribute group and lead attributes will be written
    to the `intercom_lead/`, each under the corresponding Hull user representation.
    
2) Anonymous ids are now representative of the intercom entity
    
    - Intercom users are modeled as `intercom-user:user-${intercom_id}`
    
    - Intercom leads are modeled as `intercom-lead:lead-${intercom_id}`

    
##### Migration Plan

1) Copy the relevant settings (see below) from the legacy connector to the new connector.

2) Write `intercom_user/` and `intercom_lead` attributes to a single `intercom/` attribute group.

3) For each incoming user and lead, manipulate the anonymous ids to preserve the existing
anonymous id format and guarantee user merges in Hull.


##### Migration Action Items

*Contact Hull Support for assistance through this process*

1) Copy the attribute mapping from the legacy connector to this connector.
All standard attributes on the Contact model are mapped by default.

2) Copy the outgoing events whitelist from the legacy connector to this connector.

2) Populate incoming events list with the events you would like to receive.
The default events received are limited to `user.created`, `user.deleted`, and `contact.created`.

3) To preserve the existing `intercom/` attribute group and to manipulate the anonymous
ids, in your org, install the Processor and copy this code
    ```javascript
    function() {
        return true;
    }
    ```
   
3) Create a whitelisted segment of all users with an intercom id to ensure that all
incoming Intercom traffic will run through the processor created in the previous
step.

4) The intercom connector will no longer convert leads by default. Contact us to enable this feature.


##
## Getting Started


### Add a new Intercom Connector
1. From your Connectors list in the dashboard, click `Add Connector`
2. Choose `Intercom`
3. Confirm the installation by clicking `Install`
4. Click on `Credentials` and complete the authorization flow. The window will take you to the Intercom site which will ask you to authorize Hull to
create/update users, accounts and webhooks
5. Complete the configuration of the Intercom connector

##
### Configure Your Intercom Connector

The integration synchronizes users, leads, events, and companies.


#### Lead Synchronization

##### Lead Identity
By default, the Intercom connector uses email to resolve Hull Users to Intercom Leads. 
This identification strategy can be configured in the `Lead Identity` section in the settings.

For outgoing traffic (Hull Users -> Intercom Leads), Hull checks if the lead exists in Intercom by 
searching for leads that match the identity strategy defined above. If Hull finds a match, 
the Intercom user will be updated, otherwise a new lead will be inserted.

### Incoming Leads

Leads are fetched and received by Hull in three ways:

1) `Fetch All Leads` is a manual action you can that will retrieve all users in your Intercom account

2) `Incremental Fetch` is a background job that runs at a given interval to retrieve the latest updated leads

3) `Webhooks` can be configured to accept the `user.created` webhook topic

**Configuration**

- `User Incoming Fields` defines which Intercom Lead attributes are updated/created on Hull Users.
By default, Hull will map all fields on the Intercom `Contact` model.
These mappings can be removed and additional custom attributes can be added in.


### Outgoing Leads

**Configuration**

- `Tag Users` defines whether Hull will update Intercom Leads' tags with Hull segments

- `Lead Filter` defines the segments Hull Users must be in to be sent to Intercom. If empty, 
Hull will not send any users. A user only needs to match a single segment to be sent. 

    - Note: If a Hull User belongs to a segment in the Lead Filter AND a segment in the User Filter (see below), the Hull user will
be sent as a Lead. 

- `User Outgoing Fields` defines which Hull User attributes are updated/created on Intercom Leads.
If an outgoing field mapped to Intercom does not yet exist, Hull will create that field as a custom attribute in your Intercom account.


#### User Synchronization

##### User Identity
By default, the Intercom connector uses email and external_id to resolve Hull Users to Intercom Users. 
This identification strategy can be configured in the `User Identity` section in the settings.

For outgoing traffic (Hull Users -> Intercom Users), Hull checks if the user exists in Intercom by 
searching for users that match the identity strategy defined above. If Hull finds a match, 
the Intercom user will be updated, otherwise a new user will be inserted.

### Incoming Users

Users are fetched and received by Hull in three ways:

1) `Fetch All Users` is a manual action you can that will retrieve all users in your Intercom account

2) `Incremental Fetch` is a background job that runs at a given interval to retrieve the latest updated users

3) `Webhooks` can be configured to accept the `contact.created` webhook topic

**Configuration**

- `User Incoming Fields` defines which Intercom User attributes are updated/created on Hull Users.
By default, Hull will map all fields on the Intercom `Contact` model.
These mappings can be removed and additional custom attributes can be added in.


### Outgoing Users

**Configuration**

- `Tag Users` defines whether Hull will update Intercom Users' tags with Hull segments

- `User Filter` defines the segments Hull Users must be in to be sent to Intercom. If empty, 
Hull will not send any users. A user only needs to match a single segment to be sent.

    - Note: If a Hull User belongs to a segment in the Lead Filter AND a segment in the User Filter, the Hull user will
be sent as a Lead. 

- `User Outgoing Fields` defines which Hull User attributes are updated/created on Intercom Users.
If an outgoing field mapped to Intercom does not yet exist, Hull will create that field as a custom attribute in your Intercom account.


#### Company Synchronization

##### Company Identity
By default, the Intercom connector uses domain and external_id to resolve Hull Accounts to Intercom Companies. 
This identification strategy can be configured in the `User Identity` section in the settings.

### Incoming Companies

Users are fetched and received by Hull in three ways:

1) `Fetch All Companies` is a manual action you can that will retrieve all companies in your Intercom account

2) `Incremental Fetch` is a background job that runs at a given interval to retrieve the latest updated accounts

3) `Webhooks` can be configured to accept the `company.created` webhook topic

**Configuration**9ouy

- `User Incoming Fields` defines which Intercom User attributes are updated/created on Hull Users.
By default, Hull will map all fields on the Intercom `Contact` model.
These mappings can be removed and additional custom attributes can be added in.


### Outgoing Accounts

*Currently Not Supported*


### Outgoing Events

**Configuration**

- `Hull Events Whitelist` defines which events will be sent to to Intercom. The Hull User must belong to one of
the whitelisted segments (User or Lead) 


### Incoming Events

**Configuration**

- `Intercom Events Whitelist` defines which webhook events will be accepted by Hull. The default webhooks received are 
`user.created`, `contact.created`, and `user.deleted`.

You may subscribe to the following webhook topics:

| **Topic**                         | **Description**                              | **Connector Action**                                                                                                  |
| --------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| conversation.user.created         | Customer or lead initiated message           | Create a new event “User started conversation”                                                                        |
| conversation.user.replied         | Customer or lead replies                     | Create a new event “User replied to conversation”                                                                     |
| conversation.admin.replied        | Admin conversation replies                   | Create a new event “Admin replied to conversation”                                                                    |
| conversation.admin.single.created | Admin initiated 1:1 conversation             | Create a new event “Admin started conversation”                                                                       |
| conversation.admin.assigned       | Admin conversation assignments               | Create a new event “Admin assigned conversation”                                                                      |
| conversation.admin.opened         | Admin opens conversation                     | Create new event “Admin opened conversation”                                                                          |
| conversation.admin.closed         | Admin closes conversation                    | Create a new event “Admin closed conversation”                                                                        |
| conversation.admin.noted          | Admin added a note to conversation           | Create a new event “Admin added note to conversation”
| conversation.admin.snoozed        | Admin snoozed a conversation                 | Create a new event “Admin snoozed conversation”
| conversation.admin.unsnoozed      | Admin unsnoozed a conversation               | Create a new event “Admin unsnoozed conversation”
| conversation_part.tag.created     | Conversation part was tagged                 | Create a new event “Conversation Part Tag Added”
| conversation_part.redacted        | Conversation part was redacted               | Create a new event “Conversation Part Redacted”
| user.created                      | User creations                               | Create a new user in Hull or update an existing one.                                                                  |
| user.deleted*                     | User deletions. Not for bulk operations.     | Update user in Hull.                                                                                                  |
| user.unsubscribed                 | User unsubscribes                            | Create a new event “Unsubscribed from emails”
| user.tag.created                  | User being tagged.                           | If the tag does not match a segment in Hull a new event “Added Tag” is created.                                       |
| user.tag.deleted                  | User being untagged. Not for bulk deletions. | If the tag does not match a segment in Hull a new event “Removed Tag” is created.                                     |
| user.email.updated                | User’s email address being updated.          | Update user in Hull.                                                                                                  |
| contact.created                   | Lead creations                               | Create a new user in Hull or update an existing one.                                                                  |
| contact.added_email               | Lead added an email                          | Create a new event “Updated email address”
| contact.signed_up                 | Lead converting to a Customer                | Update user in Hull and set trait `intercom.is_lead` to `false`.                                                      |
| contact.tag.created               | Lead being tagged                            | If the tag does not match a segment in Hull a new event “Added Tag” is created
| contact.tag.deleted               | Lead being untagged                          | If the tag does not match a segment in Hull a new event “Removed Tag” is created.
| visitor.signed_up                 | Visitor converted to a User                  | Create a new event “Admin closed conversation”
| company.created                   | Company created                              | Create a new event “Admin closed conversation”


\* User Deletion Caveats:
- A `user.deleted` webhook is only triggered when a single user or lead is archived.

- A `user.deleted` webhook is NOT triggered when multiple users or leads are archived in bulk. 

- A `user.deleted` webhook is NOT triggered when the user or lead is permanently deleted. 
