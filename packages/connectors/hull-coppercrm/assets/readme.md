## Getting Started

Below you will find necessary information how to get started with the CopperCRM integration.

## Permissions

You will need administrator permissions to your Copper account to perform OAuth authorization.
Make sure you have the correct access before proceeding.

## Add a new Copper Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Copper`.
3. Confirm the installation by clicking `Install`.
4. Click on the `Settings` tab and fill out the `Copper Api Key` and `Copper Associated Email` fields in the `Connect with Copper` section.  You can find these values in your Copper instance by clicking `Settings` then in the `Integrations` section click `API Keys`.  You may use values which are already there, or generate new keys. 
5. Complete the configuration of the Copper connector (see section below).

## Configure your Copper Connector
 
The following sections describe how to configure the different aspects of the Copper Connector.  The connector pulls data from Copper into Hull.  It pulls Leads, People, Companies and Opportunities.

## Leads and People

The Copper connector pulls both Leads and People from your Copper instance.  Both Leads and People have their own sections for configuration.  The sections are very similar and are documented as such.  If a Lead and a Person has the same email in Copper, they may be merged into 1 user in Hull.  However their corresponding attributes will be grouped into 2 separate groups.  One for Lead attributes, one for Person attributes.

### Lead and Person Identity
The Copper connector uses email to resolve Hull Users to Copper Leads and Prospects by default.  This identification strategy can be configured in the appropriate "Identity" section in the settings.  We restrict the fields that you can use for Identity as a safty precaution because Identity misconfiguration can cause serious data issues.  However if there's another field which you want to use as an identity field, you may contact your Hull customer success representative to request an additional identity field for mapping

### Incoming Leads and People

This section outlines the steps to receive leads and people from Copper.  Please note that incoming data cannot be filtered, and any "fetch" operation will pull all leads/people in Copper.  Fetching a subset of leads/people is not supported.  If there are unwanted Leads/People, you must remove them from Copper.

Leads and People are fetched by either clicking the respective "Fetch All" buttons to manually trigger a fetch operation, or by automatic incremental polling.  Initially once the required attributes are configured, it is a best practice to trigger a manual "Fetch All" which will backfill all of your data.  Then the automatic incremental synch will keep your data up to date in near real-time.  The incremental fetch polls on a 5 minute interval.

- **incoming lead/person attributes** - defines which `Copper Attributes Properties` are stored in `Hull User Attributes`.  Both Lead and Person attributes will be set as independent groups on the Hull user so that they do not overwrite each other
- **link person to account in hull** - defines if we will associate an incoming Copper Person (now Hull User) to a Hull Account.  You may not want this enabled if Copper is not your leading system

## Company Synchronization
The Copper connector pulls Companies from your instance.  These companies are represented in Hull as Accounts.

### Company Identity
The Copper connector uses email_domain to resolve Hull Accounts to Copper Companies by default.  This identification strategy can be configured in the "Company Identity" section in the settings. We restrict the fields that you can use for Identity as a safty precaution because Identity misconfiguration can cause serious data issues.  However if there's another field which you want to use as an identity field, you may contact your Hull customer success representative to request an additional identity field for mapping

### Incoming Companies
This section outlines the steps in order to receive accounts from Copper.  Please note that incoming accounts cannot be filtered, and any "fetch" operation will pull all accounts from Copper.  Fetching a subset of leads/people is not supported.  If there are unwanted Leads/People, you must remove them from Copper.

Accounts are fetched by either clicking the respective "Fetch All" buttons to manually trigger a fetch operation, or by automatic incremental polling.  Once the connector is setup, the data begins to flow between systems.  As with manual fetches, incoming accounts cannot be filtered.  If you wish to not import accounts into Hull, you must remove them from Copper.  Initially once the required attributes are configured, it is a best practice to trigger a manual "Fetch All" which will backfill all of your data.  Then the automatic incremental synch will keep your data up to date in near real-time.  The incremental fetch polls on a 5 minute interval.

- **incoming account attributes** - defines which `Copper Account Properties` are stored in `Hull Account Attributes` and the fields they are mapped to.


## Opportunity Synchronization
The Copper connector pulls Opportunities from your instance.  These opportunities are stored in different attribute groups on users and accounts in Hull where the relationship exists.

### Opportunity Identity
The Copper connector uses a special identity strategy for Opportunities.  In order to ingest Opportunities, an "Opportunity Type" field must be chosen.  This field not only specifies the type of opportunity, but is also used as a postfix for the attribute group where a particular opportunities attributes are stored.  If an opportunity does not have this field, the opportunity is not ingested.  You can use this to control the opportunities which are ingested into Hull.  This can also be used to analyze different types of opportunities.  For example New Opportunities vs Upsell Opportunities.  Please be aware that if you have multiple opportunities related to an account or user, the opportunities must be of different type or else their attributes will overwite each other

### Incoming Opportunity
This section outlines the steps in order to receive opportunities from Copper.  Please note that incoming opportnities generally cannot be filtered, and any "fetch" operation will pull all opportunities from Copper.  That being said, an opportunity will not be pulled if the Opportunity Type field is blank.  This can be used to not pull particular opportunities.

Opportunities are fetched by either clicking the respective "Fetch All" buttons to manually trigger a fetch operation, or by automatic incremental polling.  Once the connector is setup, the data begins to flow between systems.  Initially once the required attributes are configured, it is a best practice to trigger a manual "Fetch All" which will backfill all of your data.  Then the automatic incremental synch will keep your data up to date in near real-time.  The incremental fetch polls on a 5 minute interval.

- **incoming opportunity attributes** - defines which `Copper Opportunity Properties` are stored in Hull

### Incoming Activities
The current implementation supports the ingestion of a subset of activities from Copper.  The types of activities supported are copper account specific.  TO view your supported click the dropdown for "Activities to Fetch".  Limitations exist around the types of activities we can fetch as well as the objects we can attach them to.  Please see the Edge Case section for a more detailed explanation"

### Outgoing Data
We do not currently support the ability to send data to CopperCRM.  But that's not because we don't want to!  If you've got a need to send data to Copper, we would love to work with you to develop this feature and support your specific use case.  Please contact us at support@hull.io to request more information.

## Supported Objects
The Copper connector allows you to pull data into Hull from Copper for the following objects:

|Hull Entity|Copper Entity|
|-----------|--------------|
|User       |Lead          |
|User       |Person        |
|Account    |Company       |
|Account    |Opportunity   |
|User       |Opportunity   |
|Event       |Activity   |

No other objects besides the ones listed above are supported. If you need to synchronize additional objects please reach out to our customer success team to explore the options on a case-by-case basis.

## Components

### Synchronization of incoming data (Copper to Hull)

The Copper connector is built to incrementally poll your Copper instance for updates.  This means anytime you change an attribute in Copper, that attribute change is propogated to Hull.  The incremental poll is scheduled on 5 minute intervals, so if you don't see your data right away, it could take up to 5 minutes to call the fetch again.  As always, make sure to populate your Incoming Lead/Person/Company/Opportunity Attributes and provide a mapping to which fields you want the attributes to be stored in Hull.  Our recommended approach is creating new Copper specific fields for each of the incoming Copper attributes.

## Attributes Mappings

The Hull platform requires explicit mapping between Copper and Hull.  We primarily rely on the Hull customer to specify which datapoints should be imported.  We do this because we've found that data transparency between systems is one of the most important practices when setting up sustainable data flows.

#### Incoming (Copper -> Hull) User to Account linking

When a User (Person) is sent from Copper to Hull, the User will contain the account key for which it is associated.  This "key" is the internal Copper Id (also known as the Anonymous Id for the account).  If the Account has been pulled from Copper previously, the user should then be associated with the appropriate account in Hull.  

**If the Account has not been pulled from Copper previously, a shell account will be created in Hull so that when we do pull the Account from Copper at a later time, the appropriate users will be associated with the account automatically.**

## Edge Cases
### Email as an identifier
Users are identified by the primaryEmail which is the first email associated with the user in Copper.

### Custom Currency fields
The current implementation does not fully support custom "currency".  The monetary value can be pulled, but not the currency.  Please contact your Hull representative if this is a critical feature.

### Custom Relationships
The current implementation does not support pulling "Custom Relationship" fields.  We can pull the id of the relationship, but not any type of resolved value.  Please contact your Hull representative if this is a critical feature.

### Deletion of Opportunities
The current implementation does not support opportunity deletion.  If your opportunity is deleted, the data will still remain on the contact or account it was associated until a new opportunity overwrites that data

### Activities Supported
The current implementation does not support "system" level activities.  It only supports user generated activities.  The difference may be different by copper instance.  In order to see your supported activities, click on the "Activities to Fetch" and your supported activities should be selectable.

Additionally, latest activities are ingested only by created date.  If the activity itself is updated, it is not updated in hull.  In order to get the latest state of all of your activities, you must manually click the "Fetch All Historical Activities button"

Activities related specifically to Copper Companies or Opportunities are not supported

## Troubleshooting

### I don’t get any Copper lead/person/company/opportunity data in Hull
- Make sure you've specified attributes in the incoming attributes in the settings page.  If you set the attributes after you performed a full fetch, you may have to perform a full fetch again to retrieve all of the newly mapped attributes.
- Check the logs for incoming.user/account.error or incoming.user/account.skip to ensure that there wasn't any additional circumstance which filtered the data
- If you've waited for over 15 minutes, and have checked the above suggestions, please check the Hull Status page at: http://status.hull.io/

### I don’t get updates of recently updated Copper entities into Hull
Check your connector logs for any `incoming.job.error`. If you see any with `Unauthorized` check the api key and email to make sure they are still valid.  

If the keys were the issue, the incoming dataflow should be resumed once the correct keys are entered. You can verify that by searching for any `incoming.user.success` or `incoming.account.success` log lines (it can take around 5 minutes to show up).
To fill in any missing data you can use the approprivate `Fetch All` button.  Be careful if you have a lot of data, this action will trigger a full fetch from Copper

### I get empty Accounts
First check to see that the incoming account attributes are set.  You may not have set any attributes to pull into Hull.  In this case, we only pull in the Copper identifier so that can later associate attributes if you choose to import more attributes later.

Ensure that you have executed a full fetch by clicking the appropriate Fetch button in the settings tab of the connector.  Please be careful with this operation if you have a lot of data in Copper.  It may be that the system just hasn't pulled all the data yet from Copper.  If it's been over an hour since the full fetch has been called, please check the logs for incoming.account.error or incoming.user.error.
