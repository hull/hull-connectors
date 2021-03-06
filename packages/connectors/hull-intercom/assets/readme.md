# Intercom Connector

The Intercom Connector enables your sales team to engage with leads
and helps your support team stay in touch with customers by integrating
your Intercom data with other data sources.

Upgrading for existing Intercom connector? See [Migrate From the Intercom Legacy Connector](#migrate-from-the-intercom-legacy-connector) at the bottom of this document.

## Getting Started

In order to use the connector start by going to the settings.

First thing to do is to authorize the connector against correct Intercom App.

Once this is done rest of the settings will be enabled.
The integration synchronizes users, leads, events, and companies.
Below you can find details of how each settings section works.


## Settings Reference

### Leads Synchronization

#### Lead Identity

By default, the Intercom connector uses email to resolve Hull Users to Intercom Leads.
This identification strategy can be configured in the `Lead Identity` section in the settings.

For outgoing traffic (Hull Users -> Intercom Leads), Hull checks if the lead exists in Intercom by
searching for leads that match the identity strategy defined above. If Hull finds a match,
the Intercom Lead will be updated, otherwise a new Intercom Lead will be created.

#### Incoming Leads

Leads are fetched and received by Hull in three ways:

1. `Fetch All Leads` is a manual action you can that will retrieve all users in your Intercom account
2. `Incremental Fetch` is a background job that runs at a given interval to retrieve the latest updated leads
3. `Incoming Events` can be configured to accept the `user.created` events

**Configuration**

- `User Incoming Fields` defines which Intercom Lead attributes are updated/created on Hull Users.
By default, Hull will map all fields on the Intercom `Contact` model.
These mappings can be removed and additional custom attributes can be added in.


#### Outgoing Leads

**Configuration**

- `Tag Users` defines whether Hull will update Intercom Leads' tags with Hull segments
- `Lead Filter` defines the segments Hull Users must be in to be sent to Intercom. If empty,
Hull will not send any users. A user only needs to match a single segment to be sent.
    Note: If a Hull User belongs to a segment in the Lead Filter AND a segment in the User Filter (see below), the Hull user will
be sent as a Lead.
- `User Outgoing Fields` defines which Hull User attributes are updated/created on Intercom Leads.
If an outgoing field mapped to Intercom does not yet exist, Hull will create that field as a custom attribute in your Intercom account.


### Users Synchronization

#### User Identity

By default, the Intercom connector uses email and external_id to resolve Hull Users to Intercom Users.
This identification strategy can be configured in the `User Identity` section in the settings.

For outgoing traffic (Hull Users -> Intercom Users), Hull checks if the user exists in Intercom by
searching for users that match the identity strategy defined above. If Hull finds a match,
the Intercom user will be updated, otherwise a new user will be inserted.

#### Incoming Users

Users are fetched and received by Hull in three ways:

1. `Fetch All Users` is a manual action you can that will retrieve all users in your Intercom account
2. `Incremental Fetch` is a background job that runs at a given interval to retrieve the latest updated users
3. `Webhooks` can be configured to accept the `contact.created` webhook topic

**Configuration**

- `User Incoming Fields` defines which Intercom User attributes are updated/created on Hull Users.
By default, Hull will map all fields on the Intercom `Contact` model.
These mappings can be removed and additional custom attributes can be added in.


#### Outgoing Users

**Configuration**

- `Tag Users` defines whether Hull will update Intercom Users' tags with Hull segments
- `User Filter` defines the segments Hull Users must be in to be sent to Intercom. If empty,
Hull will not send any users. A user only needs to match a single segment to be sent.
    - Note: If a Hull User belongs to a segment in the Lead Filter AND a segment in the User Filter, the Hull user will
be sent as a Lead.
- `User Outgoing Fields` defines which Hull User attributes are updated/created on Intercom Users.
If an outgoing field mapped to Intercom does not yet exist, Hull will create that field as a custom attribute in your Intercom account.


### Companies Synchronization

#### Company Identity

By default, the Intercom connector uses domain and external_id to resolve Hull Accounts to Intercom Companies.
This identification strategy can be configured in the `User Identity` section in the settings.

#### Incoming Companies

Users are fetched and received by Hull in three ways:

1. `Fetch All Companies` is a manual action you can that will retrieve all companies in your Intercom account
2. `Incremental Fetch` is a background job that runs at a given interval to retrieve the latest updated accounts
3. `Webhooks` can be configured to accept the `company.created` webhook topic

**Configuration**

- `User Incoming Fields` defines which Intercom User attributes are updated/created on Hull Users.
By default, Hull will map all fields on the Intercom `Contact` model.
These mappings can be removed and additional custom attributes can be added in.


#### Outgoing Companies

**Configuration**

- `Tag Companies` defines whether Hull will update Intercom Companies' tags with Hull segments
- `Companies Filter` defines the segments Hull Account must be in to be sent to Intercom. If empty,
Hull will not send any accounts. An account only needs to match a single segment to be sent.
- `Company Outgoing Fields` defines which Hull Account attributes are updated/created on Intercom Company.
If an outgoing field mapped to Intercom does not yet exist, Hull will create that field as a custom attribute in your Intercom app.

## Events Synchronization

### Outgoing Events

**Configuration**

- `Hull Events Whitelist` defines which events will be sent to to Intercom. The Hull User must belong to one of
the whitelisted segments (User or Lead)


### Incoming Events

**Configuration**

- `Intercom Events Whitelist` defines which Intercom Events will be fetched by the connector. The default events received are
`user.created`, `contact.created`, and `user.deleted` (this event is subject of significant limitations, see below). You may whitelist following events:

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


\* **IMPORTANT:** User Deletion Caveats:
- A `user.deleted` webhook is only triggered when a single user or lead is archived.
- A `user.deleted` webhook is NOT triggered when multiple users or leads are archived in bulk.
- A `user.deleted` webhook is NOT triggered when the user or lead is permanently deleted.


---

## Linking website anonymous traffic with Intercom Leads

To link the anonymous traffic and the leads in Intercom, you need to be using Hull.js to track data in your website (You do this by adding a Website connector to Hull) and then you need to inject a dedicated script from Intercom connector (more on that in Website connector documentation.)

As a result the Intercom Visitor IDs will be added to the current visitor list of aliases and this will link the Intercom Lead profile and the online visitor profile.
Any tracking or traits call you make to Hull.js will also be sent to Intercom in parallel, This way you don't have to instrument your code twice.
Since this is an advanced topic and we suggest you reach out to us so we can help you set this up.

---

## Migrate From the Intercom Legacy Connector

The legacy Intercom connector was built off of the Intercom API version 1.0.
The current version of the connector was built to support
the latest Intercom API version, 2.x.

### Breaking changes between the API versions:

1. In API version 2.x, the Users API & Leads API are deprecated and replaced with the Contacts API.
  As a result, the following fields are no longer retrievable via the API:
  - `anonymous`
  - `pseudonym`
  - `session_count`
  - `referrer`
  - `utm_campaign`
  - `utm_content`
  - `utm_medium`
  - `utm_source`
  - `utm_term`
  - `postal_code`
  - `timezone`
  - `continent_code`
  - `country_code`
  - `user_agent_data`
  - `latitude`
  - `longitude`
  - `last_seen_ip`
2. The Contact field `user_id` is now `external_id`.

### Breaking changes between the Connector versions:

1. Enhanced support for Users and Leads
  - Users and leads are treated as distinct entities within a single Hull user. User attributes will be written to the `intercom_user/` attribute group and lead attributes will be written to the `intercom_lead/`, each under the corresponding Hull user representation.
2. Anonymous ids are now representative of the intercom entity
  - Intercom users are modeled as `intercom-user:user-${intercom_id}`
  - Intercom leads are modeled as `intercom-lead:lead-${intercom_id}`


### Migration Plan

1. Copy the relevant settings (see below) from the legacy connector to the new connector.
2. Write `intercom_user/` and `intercom_lead` attributes to a single `intercom/` attribute group.
3.For each incoming user and lead, manipulate the anonymous ids to preserve the existing
anonymous id format and guarantee user merges in Hull.


### Migration Action Items

*Contact [Hull Support](mailto:support@hull.io) for assistance through this process*

1. Copy the attribute mapping from the legacy connector to this connector.
All standard attributes on the Contact model are mapped by default.
2. Copy the outgoing events whitelist from the legacy connector to this connector.
3. Populate incoming events list with the events you would like to receive.
The default events received are limited to `user.created`, `user.deleted`, and `contact.created`.
4. To preserve the existing `intercom/` attribute group and to manipulate the anonymous
ids, in your org, install the Processor and copy this code:
  ```js
  function createLegacyAnonIds(targetTraits, intercomEntity, entityId) {

    const legacyAnonIds = [];
    const anonIds = user.anonymous_ids;
    const externalId = _.get(targetTraits, "user_id");

    const legacyAnonId = _.find(anonIds, aid => {
      return aid === `intercom:${entityId}`;
    });

    if (target === "user" && _.isNil(legacyAnonId)) {
      legacyAnonIds.push(`intercom:${targetId}`);
    }

    if (intercomEntity === "lead" && !_.isNil(externalId)) {
      const externalIdAnonId = _.find(anonIds, aid => {
        return aid === `intercom:${externalId}`;
      });

      if (_.isNil(externalIdAnonId)) {
        legacyAnonIds.push(`intercom:${externalId}`);
      }
    }
    return legacyAnonIds;
  }

  function createLegacyAttributes(targetTraits, target) {
    const externalId = _.get(targetTraits, "user_id");
    if (target === "lead") {
      _.set(targetTraits, "anonymous", true);
      _.set(targetTraits, "is_lead", true);
      _.set(targetTraits, "lead_user_id", externalId);
      _.set(targetTraits, "user_id", null);
    } else {
       _.set(targetTraits, "is_lead", false);
       _.set(targetTraits, "anonymous", false);
    }

    return _.reduce(targetTraits, (result, value, key) => {
      result[`intercom/${key}`] = value;
      return result;
    }, {});
  }

  const userId = _.get(user, "intercom_user.id");
  const target = !_.isNil(userId) ? "user" : "lead";
  const targetId = _.get(user, `intercom_${target}.id`);
  const targetTraits = _.cloneDeep(_.get(user, `intercom_${target}`, {}));

  if (!_.isEmpty(targetTraits) && !_.isNil(targetId)) {

    const legacyAnonIds = createLegacyAnonIds(targetTraits, target, targetId);
    const legacyTraits = createLegacyAttributes(targetTraits, target);

    _.forEach(legacyAnonIds, (legacyAnonId) => {
      hull.alias({ anonymous_id: legacyAnonId });
    });

    hull.traits(legacyTraits);
  }
  ```
5. Create a whitelisted segment of all users with an intercom id to ensure that all
incoming Intercom traffic will run through the processor created in the previous
step.
6. The intercom connector will no longer convert leads by default. [Contact us](mailto:support@hull.io) to enable this feature.
