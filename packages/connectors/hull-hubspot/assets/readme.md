Hull’s [HubSpot integration](https://hull.io/integrations/hubspot/) enables syncing of HubSpot Contacts & Companies with all your other tools through Hull’s [Customer Data Platform](https://hull.io/features/). Teams use Hull with HubSpot for:

- [Lead qualification](https://www.hull.io/playbooks/lead-qualification/)
- [Lead nurturing](https://www.hull.io/playbooks/lead-nurturing/)
- [Sales enablement](https://www.hull.io/playbooks/sales-enablement/)
- [CRM integration](https://www.hull.io/integrations/crm/)
- [Email integration](https://www.hull.io/integrations/email/)

If you have questions, feedback, or spot any outdated information, we’d love to hear from you via [email](mailto:support@hull.io).

## Getting Started

To install the HubSpot integration, you must have a HubSpot admin permissions to add and authenticate third party apps.

1. Login to your Hull Organization and navigate to **Connectors** menu in the top navigation
2. Choose **Add a Connector**
3. Click on **HubSpot**
4. Confirm by clicking **Install**
5. Within the Connector, click on the **Settings** tab. You will need to login with your HubSpot credentials to connect your HubSpot instance.

![OAuth flow first step](./docs/oauth-flow-1.png)

## Identity Resolution

Hull can sync the following objects to HubSpot. New data is upserted in both directions - existing profiles are updated, else new profiles are created automatically.

| Data Object | Hull    | HubSpot |
| ----------- | ------- | ------- |
| Person      | [User](https://www.hull.io/docs/concepts/users/)    | Contact |
| Company     | [Account](https://www.hull.io/docs/concepts/accounts/) | Company |

> **Note:** HubSpot Companies are not handled by default. You must configure this.

## Settings reference

In the HubSpot Connector Dashboard, click the **Settings** tab. Here you can set the rules to map, filter & link incoming & outgoing data.

There are four sections of settings:

- Outgoing Users
  - Whitelist Users to sync with User Segments
  - Map User Attributes to HubSpot Contacts
- Incoming Users
  - Map HubSpot Contact identifiers
  - Map HubSpot Contact properties to Hull Users
- Outgoing Accounts
  - Whitelist Accounts to sync with Account Segments
  - Map Account Attributes to HubSpot Company Properties
  - Toggle if Hull will link HubSpot Contacts & Companies
- Incoming Accounts
  - Toggle HubSpot Companies to sync into Hull
  - Map HubSpot Company identifiers
  - Map HubSpot Company Properties to Hull Accounts
  - Toggle if Hull will link Users & Accounts based on HubSpot Contact-Company associations.


### Fetching HubSpot Contacts into Hull

HubSpot Contacts and their updates are fetched into Hull manually or on a schedule.

When new data about a HubSpot Contact is [ingested](https://www.hull.io/docs/data_lifecycle/ingest/), Hull follows this process:

1. Checks if there is a matching `email`
2. If so, updates the existing Hull User
3. Else, creates a new Hull User

HubSpot Contact `VID` is captured as an `anonymous_id` and `hubspot/id` in Hull User profiles.

> **Note:** If more than one Hull User exists with the same `email` or HubSpot Contact `VID` and without a unique external_id then they will be merged. A `User merged` event will show the before/after difference in attribute values. Learn more about [User merging](https://www.hull.io/docs/data_lifecycle/ingest/#user-merging)

### Fetching HubSpot Companies into Hull

HubSpot Companies are not handled by default. This must be enabled in the Connector Settings under the **Fetch accounts** toggle.

You must select what account-level identifier to map into. This is `domain` by default.

HubSpot Companies and their updates are fetched automatically on a schedule. This can be also be fetched manually in the **Credentials & Actions** tab.

When new data about a HubSpot Company is ingested, Hull follows this process:

1. Check if the required identifier is present (e.g. `domain` for default). Skip if not.
2. Checks if there is a matching identifier in Hull (e.g. `domain`)
3. If so, updates the existing Hull Account
4. Else, creates a new Hull Account

HubSpot Company `ID` is captured as an `anonymous_id` in Hull Account profiles.

> **Note:** If more than one Hull Account exists with the same `domain` and without a unique external_id then they will be merged. Learn more about [Account merging](https://www.hull.io/docs/data_lifecycle/ingest/#account-merging).

### Linking HubSpot Contacts & Companies in Hull

Hull will associate Users and Accounts by a common `domain`. e.g. `romain@hull.io` and `www.hull.io` will be associated.

If you’d also like to match Users and Accounts in Hull by the Contact-Company relationships you have in HubSpot, you can configure this in the Connector Settings under the **Link users in Hull** toggle.

Hull will link Users with Accounts if:

- Link users in Hull is enabled
- HubSpot Contact is associated with a HubSpot Company
- HubSpot Contact has a valid identifier

If the HubSpot Company does not have a required identifier, the User will be associated with an empty Hull Account.

### Deleting HubSpot Contacts & Companies in Hull

When a HubSpot Contact or Company is deleted in HubSpot, you will have the option to mark the associated Hull User
or Hull Account as deleted in Hull. This action will remove the hubspot id from the associated entity in Hull and
the field "hubspot/deleted_at" will be added with the timestamp of the deletion.

By default, Hull will not send out Hull Users or Hull Accounts to HubSpot that have the field "hubspot/deleted_at" set. If you
would like to send those entities back out to HubSpot, which will create a new HubSpot Contact or Company, you may turn off the
toggles "Ignore Deleted Contacts" and/or "Ignore Deleted Companies".

### Creating & Updating HubSpot Contacts

Hull Users must be in a whitelisted [User Segment](https://www.hull.io/docs/concepts/segments/) to be synced to HubSpot. By default, no Users are synced.

When Hull publishes a [User Update](https://www.hull.io/docs/data_lifecycle/notify/#format-of-a-user-update-notification) for a User whitelisted to sync to HubSpot:

1. Check if there is an `email`. Skip if not.
2. If `email` exists, sync User Update to HubSpot.
3. HubSpot will then check if an existing Contact exists with the same `email` or `hubspot/id` (Contact `VID` in HubSpot)
4. If so, HubSpot will update the existing Contact
5. Else, HubSpot will create a new Contact

### Creating & Updating HubSpot Companies

Hull Accounts must be in a whitelisted [Account Segment](https://www.hull.io/docs/concepts/segments/) to be synced to HubSpot. By default, no Accounts are synced.

When Hull publishes an [Account Update](https://www.hull.io/docs/data_lifecycle/notify/#format-of-an-account-update-notification) for an Account whitelisted to sync to HubSpot

1. Check if there is an `domain`. Skip if not.
2. If `domain` exists, sync Account Update to HubSpot
2. HubSpot will then check if an existing Company exists with the same `domain`
3. If so, HubSpot will update the existing Company
4. Else, HubSpot will create a new Company

### Linking Hull Users & Accounts in HubSpot

You can associate HubSpot Contacts and Companies based on logic you have in Hull. Click the **Link Contacts in HubSpot** toggle in the Connector Settings.

Hull will link Contacts & Companies in HubSpot if:

- Link Contacts in HubSpot is enabled
- Hull User is associated with a Hull Account
- Hull Account is already synchronized with a HubSpot Company

### Fetching HubSpot Marketing Emails into Hull

HubSpot Marketing Emails will be imported into Hull manually or on a schedule. Users have the option to fetch all email events created in the last 24 hours or fetch all email events in their HubSpot instance. Email events can also be fetched by Hull on a 5 minute schedule by turning on the toggle "Fetch Email Events". The fetch buttons will fetch email events whether or not this toggle is on or off.

For an email event to be successfully fetched by Hull, the email must be a part of a marketing email campaign.

Hull will only retrieve the email events that the user has selected. The available events to retrieve are:

|                           |
| ------------------------- |
| Email Sent                |
| Email Dropped             |
| Email Processed           |
| Email Delivered           |
| Email Deferred            |
| Email Bounced             |
| Email Opened              |
| Email Link Clicked        |
| Unsubscribed / Subscribed |
| Email Marked as Spam      |


Hull will retrieve the following fields from a marketing email:

|                   |
| ----------------- |
| Email Campaign Id |
| Portal Id         |
| Email Id          |
| Link Url          |
| Sent By           |
| Recipient         |
| Created At        |
| Email Subject     |
| Email Body        |

The email body will only be retrieved if it is a plaintext html body.

### Visitor Tracking

When using HubSpot pages or HubSpot tracking code, every website visitor is assigned a unique Visitor ID called UTK. When and anonymous visitor fills out a form HubSpot will automatically associate their previous page views with a newly created or existing Hubspot Contact.

This connector allows to resolve HubSpot UTK tracked by Website connector into Contact ID to achieve the same results, this is how the feature works:

- check if user has `hubspot-utk:xxx` `anonymous_id` which is the Visitor UTK ID
- and the user does not have `hubspot:xxx` `anonymous_id` which is the Contact ID
- then hit HubSpot API to resolve UTK to Contact ID and store in back as `hubspot:xxx` `anonymous_id`

As a result the anonymous Hull User will have both UTK ID and Contact ID stored in the anonymous_ids.
This will allow to merge this Hull User with all page view events (and other events) with Hull Users tied to HubSpot Contact with HubSpot attributes. This will happen as soon as HubSpot Contact is fetched by the connector.

**IMPORTANT:** HubSpot does not create actual Contact before Visitor takes a specific action on the website. As a result even if the UTK resolution is run by the connector and both IDs are set as `anonymou_ids` the merge can't happen.


Here is how the connector can be configured:

**Resolve Contact ID from Visitor UTK** - this is a global toggle that enables the feature for manual replays and ongoing traffic

**Visitor Segment Filter** - this is a list of segments of Users which will be automatically resolved


See our documentation for a step-by-step guide how to enable the whole flow using HubSpot and Website Connectors.

---

## Data types mapping

Filter which Users & Accounts are synced to HubSpot with [User & Account Segments](https://www.hull.io/docs/concepts/segments/) in the Connector Settings.

Map which User & Account attributes are synced to and from HubSpot with the field mappers in the Connector Settings.

### Hull Data types

Quoted from Hull's [documentation](https://www.hull.io/docs/data_lifecycle/ingest/):
```text
Supported Attribute values include:

- Strings
- Array of strings
- Numeric
- Booleans
- Dates (ISO-8601 formatted strings or UNIX timestamps)
- Nested JSON Object (experimental support, use carefully)
```

### HubSpot Data types

- Strings
- Numbers
- Booleans
- Dates -> [HubSpot documentation](https://developers.hubspot.com/docs/faq/how-should-timestamps-be-formatted-for-hubspots-apis)
  ```text
    Date properties will only store the date, and must be set to midnight UTC for the date you want.
    For example, May 1 2015 would be 1430438400000 (01 May 2015 00:00:00 UTC).
  ```
  Hull stores dates using hours, minutes, and seconds. The connector will convert a date to the appropriate format that
  HubSpot expects by removing the hours, minutes, seconds of the related date. As a result, if you send a Hull Date such
  as 15 June 2019 10:05:22 UTC, a HubSpot Date field will receive it as 15 June 2019 00:00:00 UTC.
  This limitation comes from HubSpot itself, since you only use the day, month and year when you pick a date on the Dashboard.
  See the example below.
  ![HubSpot Date picker](./docs/HubSpot_Date_Picker.png)

 - Datetimes -> [HubSpot documentation](https://developers.hubspot.com/docs/faq/how-should-timestamps-be-formatted-for-hubspots-apis)
  ```text
    Datetime properties can store any time, so any valid millisecond timestamp would be accepted.
    In HubSpot, datetime properties are displayed based on the time zone of the user viewing the record,
    so the value will be converted to the local time zone of the user.
  ```
  Here the HubSpot's `Datetime` format is exactly the same as Hull's `Date` format.

- Enumeration (made of above types), mostly used as a *"choose your value(s)"* from a dropdown list.
  In this data type, you can end up having an array of the selected type.
  Such a thing is happening for the `Hull segments` field that you can notice in any HubSpot contact imported from Hull.

*📚 Other links used for that documentation*
  - [*Contact Properties Overview*](https://developers.hubspot.com/docs/methods/contacts/contact-properties-overview)
  - [*Company Properties Overview*](https://developers.hubspot.com/docs/methods/companies/company-properties-overview)

### Data mapping

Here you will find what type conversions are supported in the table below.
- ✅ : Works and is intuitive to convert
- ⚠️ : Can work but under certain condition(s)
- ❌ : Cannot be converted or would not make sense to

#### Outgoing - From Hull to HubSpot data types
| Hull Type               | HubSpot String |  HubSpot Number  |         HubSpot Bool        |          HubSpot Date         | HubSpot Datetime | HubSpot Enumeration |
|-------------------------|:--------------:|:----------------:|:---------------------------:|:-----------------------------:|:----------------:|:-------------------:|
| String                  |        ✅       |        ✅       |            ⚠️¹             |               ❌               |        ❌       |          ❌         |
| String_Array            |        ❌       |        ❌       |             ❌             |               ❌               |        ❌       |          ✅         |
| Numeric                 |        ✅       |        ✅       |            ⚠️²             |               ❌               |        ❌       |          ❌         |
| Boolean                 |        ✅       |        ✅       |             ✅             |               ❌               |        ❌       |          ❌         |
| Date                    |        ✅       |        ✅       |             ❌             |              ⚠️³               |        ✅       |          ❌         |
| JSON                    |        ❌       |        ❌       |             ❌             |               ❌               |        ❌       |          ❌         |

  1. Hull String must be "True" or "False"
  2. Hull Number must be 0 or 1
  3. Hours:Minutes:Seconds will be removed

#### Incoming - From HubSpot to Hull data types

| HubSpot type | Hull String | Hull Array of strings | Hull Boolean | Hull Date | Hull JSON |
|--------------|:-----------:|:---------------------:|:------------:|:---------:|:---------:|
| String       |      ✅     |           ❌          |     ⚠️¹     |     ✅    |     ❌    |
| Number       |      ✅     |           ❌          |     ⚠️²     |     ❌    |     ❌    |
| Bool         |      ✅     |           ❌          |     ✅      |     ❌    |     ❌    |
| Date         |      ✅     |           ❌          |     ❌      |     ✅    |     ❌    |
| Datetime     |      ✅     |           ❌          |     ❌      |    ️✅    |     ❌    |
| Enumeration  |      ❌     |           ✅          |     ❌      |     ❌    |     ❌    |

1. HubSpot String must be "True" or "False"
2. HubSpot Number must be 0 or 1

### Special cases

#### HubSpot - Picklist

##### How to use them
A HubSpot "Picklist" is a HubSpot field with a customizable format. Most of the time, you will encounter them under
the format of a dropdown field with a list of checkboxes. To reach that result, picklists have in their definitions
the `enumeration` HubSpot `"type"`, and the `checkbox` HubSpot `"fieldType"` .
More information can be found in HubSpot's API [documentation](https://developers.hubspot.com/docs/methods/contacts/v2/create_contacts_property)

Here is what would be the definition of an `Enumeration` using that dropdown of checkboxes:
```json
{
    	"name": "hull_test_enum",
    	"label": "Test Enumeration",
    	"groupName": "hull",
    	"type": "enumeration",
    	"fieldType": "checkbox",
    	"options": [
        {
          "label": 1,
          "value": 1
        },
        {
          "label": "Option 2",
          "value": 2
        },
        {
          "label": 333,
          "value": "3"
        },
        {
          "label": "Big Number",
          "value": 1565354818310
        }
      ]
    }
```
You can customize the name of each element in the `"options"` by changing the `"label"`, however the `"value"` holds the
true content for each option.

This enum results in the following HubSpot UI element:
![HubSpot Enumeration example](./docs/HubSpot_Test_Enumeration.png)

All the selected options in that field will be stored in the contact properties using the following format:
```json
{
 "value": "1;3;1565354818310"
}
```
Again, note here that the selected options are referred with the `"value"` fields defined above, not as their `"label"`.

##### Conversion
The Hull - string array <=> HubSpot - Enum conversion works in both directions, by parsing each values separated
by a `;` for incoming data.

In the case of outgoing data, for each element in the Hull - string array, `"value"` and `"label"` fields  will share
the same value when creating the definition of the HubSpot enumeration. You will not be able to customise the label if
you export a Hull - string array to HubSpot.

### Data types supported

| Data type                   | Hull               | HubSpot                                          |
| --------------------------- | ------------------ | ------------------------------------------------ |
| Standard Person Attributes  | User Attributes    | Contact Properties                               |
| Custom Person Attributes    | User Attributes    | Custom Contact Properties (grouped under `Hull`) |
| Standard Company Attributes | Account Attributes | Company Properties                               |
| Custom Company Attributes   | Account Attributes | Custom Company Properties (grouped under `Hull`) |

### Fetching HubSpot Properties

All default HubSpot Contact & Company Properties are fetched and stored as a HubSpot attributes group on Hull User & Account profiles.

In the Connector Settings, under the **Custom Fields Sync (HubSpot to Hull)** headings for Users & Accounts, you can map and name HubSpot Custom Properties into Hull. These will also appear under the HubSpot attributes group on Hull User & Account profiles.

### Creating & Updating HubSpot Properties

In the connector settings, under the **Custom Fields Sync (Hull to HubSpot)** headings for Users & Accounts, you can map Hull User & Account Attributes to Custom Properties in HubSpot Contact & Company profiles. These will appear under a Hull group in HubSpot.

You can create new properties in HubSpot from Hull field mapping. As you type right column of the field mapper, you’ll be prompted to “Create” the field you’re typing.

### Segmentation

You can sync Hull [User & Account Segments](https://www.hull.io/docs/concepts/segments/) to HubSpot.

| Group               | Hull             | HubSpot                          |
| ------------------- | ---------------- | -------------------------------- |
| Groups of people    | User Segments    | `Hull_Segments` contact property |
| Groups of companies | Account Segments | `Hull_Segments` company property |


## Sync Frequency & Limitations

Hull ingests data from the HubSpot connector through the [Firehose API](https://www.hull.io/docs/data_lifecycle/ingest/#messages).

Learn more about [HubSpot’s API usage guidelines](https://developers.hubspot.com/apps/api_guidelines).

| HubSpot API limits             | 40,000 per day                    |
| ------------------------------ | --------------------------------- |
| HubSpot Rate Limits            | 10 requests per second            |
| Bulk operation limitations     | Batches of 100 contacts/customers |
| Fetch updates sync frequency   | Every 5 minutes                   |
| Sync data from Hull to HubSpot | With every User or Account update |

---

## Troubleshooting

### I don’t get any HubSpot Company data in Hull

Check you have setup identifiers for accounts. See [data mapping](#data-mapping)

### I don’t get updates of recently updated Contacts or Companies into Hull

Check your connector logs for any `incoming.job.error`. If you see any with `Permission error`, you need to re-authenticate the HubSpot Connector. Go to the **Credentials & Actions** and perform the OAuth flow authorization again using the **Start over** button.

All your connector settings (including data mapping) will remain the same.

After re-authenticating, your data flow should resume. You can also run a **Fetch all Contacts** or **Fetch all Companies** in the connectors tab. Search the connector logs for `incoming.user.success` or `incoming.account.success` to verify data is flowing again - this can take up to 5 minutes.

**Note:** Make sure you link with the same HubSpot portal. Changing the portal can lead to data corruption.

### I don’t see recently mapped fields in Hull

In the HubSpot Connector settings, go to **Credentials & Actions** and then click **Fetch all Contacts** for contact properties or **Fetch all Companies** for company properties.

It may take a few minutes for the import of data to be ingested and be shown in Hull.

### I don’t see recently mapped fields in HubSpot

You can manually sync the Users and Accounts to HubSpot. Go to the User or Account Profiles, or create a User or Account Segment then select the **Send to** button and choose HubSpot. Click confirm.

### I get empty companies in Hull

Make sure you set the required account identifiers in the Connector settings.

### My HubSpot Contact or Companies are not updated due to "duplicate property value" error

If you see `duplicate property value` error in your `outgoing.user.error` or `outgoing.account.error` logs it means that you have duplicate entry in your outgoing attribute mapping.

You can inspect `hubspotWriteContact` parameter in the logs to see the exact payload the connector tried & failed to send to HubSpot. Search for any attribute name which appears twice in the same payload. Once you have identified the duplicate attribute, remove the extra entry in the attributes mapper in the Connector Settings.

Once you have reconfigured you data mapping, resend the affected Users & Accounts to HubSpot with the **Send to** button on the Profiles or Segmentation tool.

### Any questions?

If you have any questions or have suggestions to improve this documentation, please [email](mailto:support@hull.io) us.
