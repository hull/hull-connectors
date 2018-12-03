## Overview (Outreach and Hull)
*************** (This Overview part below needs to go away, but be linked to the marketing overview page...) ***************
Hull's Outreach connector enables the synchronization between Outreach and Hull.  This in turn allows synchronization between any other system which the customer has setup with Hull.  The connector synchronizes "Outreach Prospects" with "Hull Users" using the first email found in Outreach as the key to join with Users in the Hull system.  The connector also synchronizes "Outreach Accounts" with "Hull Accounts" using the domain found in Outreach as the key to join other Accounts in the Hull system.

Events sent from Outreach such as email opens, or sequence state changes are not currently supported, but are planned when enough Hull customer feedback has been gathered on the respective use cases.

## Getting Started

Below you will find necessary information how to get started with the Outreach integration.

*************** Link for "Beginners guide to Hull" and Link for High level "what outreach connector does" *************


### Permissions

You will need administrator permissions to your Outreach account to perform oAuth authorization.
Make sure you have the correct access before proceeding.

### Add a new Outreach Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Outreach`.
3. Confirm the installation by clicking `Install`.
4. Click on `Credentials` and complete the authorization flow.  The window will take you to the Outreach site which will ask you to authorize Hull to
create/update users, accounts and webhooks.
5. Complete the configuration of the Outreach connector (see section below).

### Configure your Outreach Connector

There are 4 sections of settings which you can configure depending on what kind of synchronization you need.

### Outgoing Users

This section outlines the steps in order to send users from Hull to Outreach (outgoing user data)

- **outgoing user segments** - defines which user segments are sent to Outreach, any user which enters one of these segments is sent to Outreach, as is any changes in attributes on those users.  Make sure to configure attributes to be sent to Outreach (below) or nothing (except a shell) will be sent even if the user is in the segment.
- **outgoing user attributes** - defines which `Hull User Attributes` are updated/created on `Outreach Prospect` and the field they are mapped to.

### Incoming Users

This section outlines the steps in order to receive users (prospects) from Outreach.  Please note that incoming users cannot be filtered, and any "fetch" operation will pull all users in Outreach (unless there is more than 10000 users).  In order to fetch only a subset, you must remove the unwanted Prospects from Outreach.

Also note that when a user is fetched from Outreach, the connector will also fetch the user's corresponding "Outreach Account Id".  Which means that if the associated account has not been fetched from Outreach yet, Hull will create a shell account until the account's full information has been pulled from Outreach.

Users are fetched by either clicking "Actions" and manually triggering a fetch operation, or by incoming webhook.  Outreach provides a feature that fires user creation and attribute change events to Hull.  Once the connector is setup, the data begins to flow between systems, Outreach will begin to send these webhooks to Hull.  As with manual fetches, incoming users cannot be filtered.  If you wish to not import users into Hull, you must remove them from Outreach.  User deletion over webhooks is not currently a supported feature.

- **incoming user attributes** - defines which `Outreach Prospect Properties` are stored in `Hull User Attributes`

### Outgoing Accounts

This section outlines the steps in order to send accounts from Hull to Outreach (outgoing account data)

- **outgoing account segments** - defines which account segments are sent to Outreach, any account which enters one of these segments is sent to Outreach, as is any changes in attributes on those accounts.  Make sure to configure attributes to be sent to Outreach (below) or nothing (except a shell) will be sent even if the account is in the segment.
- **outgoing account attributes** - defines which `Hull Account Attributes` are updated/created on `Outreach Account`

*************** Is this section below applicable to Outreach? *****************
- **outgoing user linking** - defines if Hull will associate `Outreach Prospect` to `Outreach Account` (see below how the linking is performed)

### Incoming Accounts
This section outlines the steps in order to receive accounts from Outreach.  Please note that incoming accounts cannot be filtered, and any "fetch" operation will pull all accounts from Outreach (unless there is more than 10000 accounts).  In order to fetch only a subset, you must remove the unwanted Accounts from Outreach.

Accounts are fetched by either clicking "Actions" and manually triggering a fetch operation, or by incoming webhook.  Outreach provides a feature that fires account creation and attribute change events to Hull.  Once the connector is setup, the data begins to flow between systems, Outreach will begin to send these webhooks Hull.  As with manual fetches, incoming accounts cannot be filtered.  If you wish to not import accounts into Hull, you must remove them from Outreach.  Account deletion over webhooks is not currently a supported feature.

*************** (Pending Account Claims Discussion) ***************
- **incoming account identity** - specify which `Outreach Account Properties` we will use to identify `Hull Account`
- **incoming account attributes** - defines which `Outreach Account Properties` are stored in `Hull Account Attributes` and the fields they are mapped to.

*************** Is this section below applicable to Outreach? *****************
- **incoming user linking** - defines if Hull will link `Hull User` with `Hull Account` depending on `Outreach Prospect` to `Outreach Account` association



## Supported Objects
The Outreach connector allows you to synchronize data between Hull and Outreach for the following objects:

|Hull Entity|Outreach Entity|
|-----------|--------------|
|User       |Prospect      |
|Account    |Account       |

No other objects besides the ones listed above are supported. If you need to synchronize additional objects please reach out to our customer success team to explore the options on a case-by-case basis.

## Outgoing User Identity Resolution
The Outreach connector uses email to resolve Hull Users to Outreach Prospects by default.  On outgoing traffic (Hull -> Outreach) we first check to see if we have received the user from Outreach before.  If so, we'll have the Outreach id for the user and we'll be able to update the user in Outreach.  If we have the Outreach id, we will first check to see if the id for the user is still valid (the user could have been deleted) by looking up the user by id.  If the user still exists we update the existing user by id.

If the user was not found by id, or the Outreach id does not exist, we look up the user by email address.  If a prospect with the same email exists in Outreach, we update that prospect.  However if the user does not exist based on an email lookup, we proceed to insert the user.

Once we've synchronized the user to Outreach, we read back the current state of the user in Outreach to hull.  As usual, only the attributes which are specified in the incoming user attributes are synchronized.

## Outgoing Account Identity Resolution
The Outreach connector uses domain to resolve Hull Accounts to Outreach Accounts by default.  On outgoing traffic (Hull -> Outreach) we first check to see if we have received the account from Outreach before.  If so, we'll have the Outreach id for the account and we'll be able to update the account in Outreach.  If we have the Outreach id, we will first check to see if the id for the account is still valid (the account could have been deleted) by looking up the account by id.  If the account still exists we update the existing account by id.

If the account was not found by id, or the Outreach id does not exist, we look up the account by domain.  If an account with the same domain exists in Outreach, we update that account.  However if the account does not exist based on an domain lookup, we proceed to insert the account.

Once we've synchronized the account to Outreach, we read back the current state of the account in Outreach to hull.  As usual, only the attributes which are specified in the incoming account attributes are synchronized.

## Components

### Synchronization of outgoing data (Hull to Outreach)

The Outreach connector receives updates to `Hull Users` and `Accounts` in near real-time and makes requests to the Outreach API. The data synchronization maps the default attributes to Outreach properties according to the tables below. If you have defined custom properties in Outreach and configured mappings, the synchronization will also contain these fields.

Additionally you can manually select `Hull Users` or `Accounts` in the Hull web application and send them to the connector. This will bypass segment filtering and force update of `Outreach Prospects` and `Accounts`.

*************** Is this section below applicable to Outreach? *****************
#### User to Account linking

When the Hubspot connector process update on a `Hull User` profile and:
1. the **outgoing user linking** setting is turned on
2. the `Hull User` is linked to an `Account`
3. linked `Hull Account` was already synchronized to `Outreach Account` (we know the Outreach identifier)

it will associate the `Outreach Prospect` with `Account`.

### Synchronization of incoming data (Outreach to Hull)

The Outreach connector is built with a webhook component which will synchronize changes in Outreach in real-time to Hull.  This means anytime you change an attribute in Outreach, that attribute change is propogated to Hull.  As always, make sure to populate your Incoming User and Account Attributes and provide a mapping to which fields you want the Outreach data populating.  Our recommended approach is creating new Outreach specific fields for each of the incoming Outreach attributes.


*************** Is this section below applicable to Outreach? *****************
#### User to Account linking

When the Hubspot connector fetch a `Hubspot Contact` and:
1. the **incoming user linking** setting is turned on
2. the `Hubspot Contact` was associated with a `Company`
3. the `Hubspot Contact` satisfy the incoming identity resolution

it will try to link the stored `Hull User` with appropriate `Hull Account`.


**This mean it will create an empty Hull Account which will be only filled in with Hubspot Company data if the Company itself satisfies the incoming identity requirements. If not the Hull User will be linked to an empty Hull Account.**

## Attributes Mappings

The Hull platform requires explicit mapping between Outreach and Hull.  We populate system defaults, but we primarily rely on the Hull customer to specify which datapoints should be imported and exported.  We do this because we've found that data transparency between systems is one of the most important practices when setting up sustainable data flows.  Below are the only mandated data fields between Hull and Outreach.  They are mandated because the Outreach Api will not support data without these fields.

< TODO: INSERT TABLES FOR DEFAULTS >

## Troubleshooting

### I don’t get any Outreach account/prospect data in Hull
- Check the identifiers which you specified in the settings.  Do those identifiers exist in Outreach?
- Make sure you've specified attributes in the incoming attributes in the settings page.  If you set the attributes after you performed a full fetch, you may have to perform a full fetch again to retrieve all of the newly mapped attributes.
- Check the logs for incoming.user/account.error or incoming.user/account.skip to ensure that there wasn't any additional circumstance which filtered the data
- If you've waited for over 15 minutes, and have checked the above suggestions, please check the Hull Status page at: http://status.hull.io/

### I don’t get updates of recently updated Contacts or Companies into Hull
Check your connector logs for any `incoming.job.error`. If you see any with `Unauthorized` go to the `Credentials` Tab and perform the oAuth flow authorization again.  Make sure that you are linking the connector again to the same Outreach portal. Changing the portal on once installed connector can lead to data corruption. This operation does not reset any settings from the connector.
Right after it's done the incoming dataflow should be resumed. You can verify that by searching for any `incoming.user.success` or `incoming.account.success` log lines (it can take around 5 minutes to show up).
To fill in any missing data you can use `Fetch all Accounts and Prospects` button which can be viewed by clicking the "Action" button in the settings page.  Be careful if you have a lot of data, this action will trigger a full fetch from Outreach

### I don’t see recently added/updated fields in Outreach
You may explicitly send particular users and accounts by searching for them in the Hull web app, and clicking the checkbox on the left side of each row.  Then, in the upper right hand corner of the interface you can click "Send to" and specify which connector you want to send the users/accounts to.

### I get empty Accounts
First check to see that the incoming account attributes are set.  You may not have set any attributes to pull into Hull.  In this case, we only pull in the outreach identifier so that can later associate attributes if you choose to import more attributes later.

Ensure that you have executed a full account and prospect fetch by clicking "Actions" in the settings tab of the connector, then initiating the fetch.  Please be careful with this operation if you have a lot of data in Outreach.  It may be that the system just hasn't pulled all the data yet from Outreach.  If it's been over an hour since the full fetch has been called, please check the logs for incoming.account.error or incoming.user.error.
