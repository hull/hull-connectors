## Getting Started

Below you will find necessary information how to get started with the Outreach integration.

## Permissions

You will need administrator permissions to your Outreach account to perform oAuth authorization.
Make sure you have the correct access before proceeding.

## Add a new Outreach Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Outreach`.
3. Confirm the installation by clicking `Install`.
4. Click on `Credentials` and complete the authorization flow.  The window will take you to the Outreach site which will ask you to authorize Hull to
create/update users, accounts and webhooks.
5. Complete the configuration of the Outreach connector (see section below).

## Configure your Outreach Connector

The following sections describe how to configure the different aspects of the Outreach Connector.  The connector synchronizes Users and Accounts.

## User Synchronization

## User Identity
The Outreach connector uses email to resolve Hull Users to Outreach Prospects by default.  This identification strategy can be configured in the "User Identity" section in the settings.  For example, if there is another field you wish to use as an identifier, you may click "Add new item" and map an Outreach field to "externalId" and your custom id will be used to resolve users.

For outgoing traffic (Hull -> Outreach) we first check to see if we have received the user from Outreach before.  If so, we'll have the Outreach id for the user and we'll be able to update the user in Outreach.  If the the Outreach id does not exist, we look up the user by email and any other attributes which may have been specified in the "User Identity".  If a prospect with the same identification exists in Outreach, we update that prospect.  However if the user does not exist based on the lookup, we proceed to insert the user.

Once we've synchronized the user to Outreach, we read back the current state of the user in Outreach to hull.  As usual, only the attributes which are specified in the incoming user attributes are synchronized.

### Incoming Users

This section outlines the steps in order to receive users (prospects) from Outreach.  Please note that incoming users cannot be filtered, and any "fetch" operation will pull all users in Outreach (unless there is more than 10000 users).  In order to fetch only a subset, you must remove the unwanted Prospects from Outreach.

Also note that when a user is fetched from Outreach, the connector will also fetch the user's corresponding "Outreach Account Id".  Which means that if the associated account has not been fetched from Outreach yet, Hull will create a shell account until the account's full information has been pulled from Outreach.

Users are fetched by either clicking "Actions" and manually triggering a fetch operation, or by incoming webhook.  Outreach provides a feature that fires user creation and attribute change events to Hull.  Once the connector is setup, the data begins to flow between systems, Outreach will begin to send these webhooks to Hull.  As with manual fetches, incoming users cannot be filtered.  If you wish to not import users into Hull, you must remove them from Outreach.  User deletion over webhooks is not currently a supported feature.

- **incoming user attributes** - defines which `Outreach Prospect Properties` are stored in `Hull User Attributes`
- **link user to account in hull** - defines if we will associate an incoming Outreach Prospect (now Hull User) to a Hull Account.  See section "Incoming (Outreach -> Hull) User to Account linking" below for a more comprehensive explanation.

### Outgoing Users

This section outlines the steps in order to send users from Hull to Outreach (outgoing user data)

- **outgoing user segments** - defines which user segments are sent to Outreach, any user which enters one of these segments is sent to Outreach, as is any changes in attributes on those users.  Make sure to configure attributes to be sent to Outreach (below) or nothing (except a shell) will be sent even if the user is in the segment.
- **outgoing user attributes** - defines which `Hull User Attributes` are updated/created on `Outreach Prospect` and the field they are mapped to.
- **link user to account in service** - defines if we will attempt to associate a outgoing Hull User (now a Outreach Prospect) to a Outreach Account.  See section "Outgoing (Hull -> Outreach) User to Account linking" below for a more comprehensive explanation.

## Account Synchronization

### Account Identity
The Outreach connector uses domain to resolve Hull Accounts to Outreach Accounts by default.  This identification strategy can be configured in the "Account Identity" section in the settings.  For example, if you would like to use another field to resolve accounts, you may click "Add new item" and map an Outreach field to ExternalId in Hull and your custom id will be used to resolve accounts.

For outgoing traffic (Hull -> Outreach) we first check to see if we have received the account from Outreach before.  If so, we'll have the Outreach id for the account and we'll be able to update the account in Outreach. If the Outreach id does not exist, we look up the account by domain and any other attribute which may have been specified in the "Account Identity".  If an account with the same identity exists in Outreach, we update that account.  However if the account does not exist based on the lookup, we proceed to insert the account.

Once we've synchronized the account to Outreach, we read back the current state of the account in Outreach to hull.  As usual, only the attributes which are specified in the incoming account attributes are synchronized.

### Outgoing Accounts

This section outlines the steps in order to send accounts from Hull to Outreach (outgoing account data)

- **outgoing account segments** - defines which account segments are sent to Outreach, any account which enters one of these segments is sent to Outreach, as is any changes in attributes on those accounts.  Make sure to configure attributes to be sent to Outreach (below) or nothing (except a shell) will be sent even if the account is in the segment.
- **outgoing account attributes** - defines which `Hull Account Attributes` are updated/created on `Outreach Account`

### Incoming Accounts
This section outlines the steps in order to receive accounts from Outreach.  Please note that incoming accounts cannot be filtered, and any "fetch" operation will pull all accounts from Outreach (unless there is more than 10000 accounts).  In order to fetch only a subset, you must remove the unwanted Accounts from Outreach.

Accounts are fetched by either clicking "Actions" and manually triggering a fetch operation, or by incoming webhook.  Outreach provides a feature that fires account creation and attribute change events to Hull.  Once the connector is setup, the data begins to flow between systems, Outreach will begin to send these webhooks Hull.  As with manual fetches, incoming accounts cannot be filtered.  If you wish to not import accounts into Hull, you must remove them from Outreach.  Account deletion over webhooks is not currently a supported feature.

- **incoming account identity** - specify which `Outreach Account Properties` we will use to identify `Hull Account`
- **incoming account attributes** - defines which `Outreach Account Properties` are stored in `Hull Account Attributes` and the fields they are mapped to.


## Supported Objects
The Outreach connector allows you to synchronize data between Hull and Outreach for the following objects:

|Hull Entity|Outreach Entity|
|-----------|--------------|
|User       |Prospect      |
|Account    |Account       |

No other objects besides the ones listed above are supported. If you need to synchronize additional objects please reach out to our customer success team to explore the options on a case-by-case basis.

## Components

### Synchronization of outgoing data (Hull to Outreach)

The Outreach connector receives updates to `Hull Users` and `Accounts` in near real-time and makes requests to the Outreach API. The data synchronization maps the default attributes to Outreach properties according to the tables below. If you have defined custom properties in Outreach and configured mappings, the synchronization will also contain these fields.

Additionally you can manually select `Hull Users` or `Accounts` in the Hull web application and send them to the connector. This will bypass segment filtering and force update of `Outreach Prospects` and `Accounts`.

### Synchronization of incoming data (Outreach to Hull)

The Outreach connector is built with a webhook component which will synchronize changes in Outreach in real-time to Hull.  This means anytime you change an attribute in Outreach, that attribute change is propogated to Hull.  As always, make sure to populate your Incoming User and Account Attributes and provide a mapping to which fields you want the Outreach data populating.  Our recommended approach is creating new Outreach specific fields for each of the incoming Outreach attributes.

## Attributes Mappings

The Hull platform requires explicit mapping between Outreach and Hull.  We populate system defaults, but we primarily rely on the Hull customer to specify which datapoints should be imported and exported.  We do this because we've found that data transparency between systems is one of the most important practices when setting up sustainable data flows.  Below are the only mandated data fields between Hull and Outreach.  They are mandated because the Outreach Api will not support data without these fields.

#### Incoming (Outreach -> Hull) User to Account linking

When a User (Prospect) is sent from Outreach to Hull, the User will contain the account key for which it is associated.  This "key" is the internal Outreach Id (also known as the Anonymous Id for the account).  If the Account has been pulled from Outreach previously, the user should then be associated with the appropriate account in Hull.  

**If the Account has not been pulled from Outreach previously, a shell account will be created in Hull so that when we do pull the Account from Outreach at a later time, the appropriate users will be associated with the account automatically.**

#### Outgoing (Hull -> Outreach) User to Account linking

When a User is sent from Hull to Outreach, the User on the Hull side may be associated with an account.  We first will lookup to see if that account exists in Outreach.  We lookup by the attributes defined in the Outgoing Account Resolution section.  If the account is found, the Outreach Prospect will be removed from any previous Account and attached to the newly found account.  If an Account is not found, we will create a new account with the account information in Hull.  As with all outgoing traffic, the new account will be created with the attributes specified in the outgoing account attribute mappings.

## Edge Cases
### Email as an identifier
In Outreach, you may assign a Prospect multiple email addresses.  By default we pick the first email in the list to be the representative email in Hull.  So please be careful if you are shuffling the emails in Outreach.  In many cases if we've already received the prospect and we have the internal outreach id, this shuffling should be ok, but if the first email on the Prospect changes, it could trigger other merging scenarios potentially.
Additionally, because email is an array, when sending users to be updated in Outreach, we do not update the emails on Outreach's side by default.  In the case where we looked up and found a prospect, we are able to merge the email into the existing array of emails in Outreach.  But when we are typically doing updates with already synchronized Prospects, we do not update email because we cannot reliably set the email without possibly overwriting other emails.


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
