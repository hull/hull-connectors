## Getting Started

Below you will find necessary information how to get started with the Pipedrive integration.

## Permissions

You will need administrator permissions to your Pipedrive account to perform OAuth authorization.
Make sure you have the correct access before proceeding.

## Add a new Pipedrive Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Pipedrive`.
3. Confirm the installation by clicking `Install`.
4. Click on `Credentials` and complete the authorization flow. The window will take you to the Pipedrive site which will ask you to authorize Hull to
create/update users, accounts and webhooks.
5. Complete the configuration of the Pipedrive connector (see section below).

## Configure your Pipedrive Connector

The following sections describe how to configure the different aspects of the Pipedrive Connector. The connector synchronizes Users as Pipedrive Persons and Accounts as Pipedrive Organizations.

## Persons Synchronization

### User Identity
The Pipedrive connector uses email to resolve Hull Users to Pipedrive Persons by default. This identification strategy can be configured in the "User Identity" section in the settings. For example, if there is another field you wish to use as an identifier, you may click "Add new item" and map a Pipedrive field to "externalId" and your custom id will be used to resolve users.

For outgoing traffic (Hull -> Pipedrive), we first check to see if we have received the user from Pipedrive before. If so, we'll have the Pipedrive id for the user and we'll be able to update the user in Pipedrive. If the Pipedrive id does not exist, we will look up the user by email and any other attributes which may have been specified in the "User Identity". If a prospect with the same identification exists in Pipedrive, we update that person. However, if the user does not exist based on the lookup, we proceed to insert the user.

Once we've synchronized the user to Pipedrive, we read back the current state of the user in Pipedrive to Hull. Only those attributes which are specified in the incoming user attributes are synchronized.

### Incoming Users

This section outlines the steps in order to receive users (persons) from Pipedrive. Please note that incoming users cannot be filtered, and any "fetch" operation will pull all users in Pipedrive. In order to fetch only a subset, you must remove the unwanted Persons from Pipedrive.

Also note that when a user is fetched from Pipedrive, the connector will also fetch the user's corresponding "Pipedrive Organization Id", which means that if the associated account has not been fetched from Pipedrive yet, Hull will create a shell account until the account's full information has been pulled from Pipedrive.

Users are fetched by either clicking "Actions" and manually triggering a fetch operation, or by incoming webhook. Pipedrive provides a feature that fires user creation and attribute change events to Hull. Once the connector is setup, the data begins to flow between systems, Pipedrive will begin to send these webhooks to Hull. As with manual fetches, incoming users cannot be filtered. If you wish to not import users into Hull, you must remove them from Pipedrive.

- **incoming user attributes** - defines which `Pipedrive Person Properties` are stored in `Hull User Attributes`
- **link user to account in hull** - defines if we will associate an incoming Pipedrive Person (now Hull User) to a Hull Account. See section "Incoming (Pipedrive -> Hull) User to Account linking" below for a more comprehensive explanation.

### Outgoing Users

This section outlines the steps in order to send users from Hull to Pipedrive (outgoing user data)

- **outgoing user segments** - Defines which user segments are sent to Pipedrive. Any user which enters one of these segments will be sent to Pipedrive as well as users that are in these segments and have any relevant attribute changes. Make sure to configure the attributes to be sent to Pipedrive (below) or nothing (except a shell) will be sent even if the user is in the segment.
- **outgoing user attributes** - Defines which `Hull User Attributes` are updated/created on `Pipedrive Person` and the field they are mapped to.
- **link user to account in service** - Defines if we will attempt to associate a outgoing Hull User (now a Pipedrive Person) to a Pipedrive Organization. See section "Outgoing (Hull -> Pipedrive) User to Account linking" below for a more comprehensive explanation.

## Account Synchronization

### Account Identity
The Pipedrive connector uses domain to resolve Hull Accounts to Pipedrive Organizations by default. This identification strategy can be configured in the "Account Identity" section in the settings. For example, if you would like to use another field to resolve accounts, you may click "Add new item" and map an Pipedrive field to ExternalId in Hull and your custom id will be used to resolve accounts.

For outgoing traffic (Hull -> Pipedrive) we first check to see if we have received the account from Pipedrive before. If so, we'll have the Pipedrive id for the account and we'll be able to update the account in Pipedrive. If the Pipedrive id does not exist, we look up the account by domain and any other attribute which may have been specified in the "Account Identity". If an account with the same identity exists in Pipedrive, we update that account. However if the account does not exist based on the lookup, we proceed to insert the account.

Once we've synchronized the account to Pipedrive, we read back the current state of the account in Pipedrive to hull. Only those attributes which are specified in the incoming account attributes are synchronized.

### Outgoing Accounts

This section outlines the steps in order to send accounts from Hull to Pipedrive (outgoing account data)

- **outgoing account segments** - Defines which account segments are sent to Pipedrive. Any account which enters one of these segments will be sent to Pipedrive as well as accounts that are in these segments and have any relevant attribute changes. Make sure to configure attributes to be sent to Pipedrive (below) or nothing (except a shell) will be sent even if the account is in the segment.
- **outgoing account attributes** - defines which `Hull Account Attributes` are updated/created on `Pipedrive Organization`

### Incoming Accounts
This section outlines the steps in order to receive accounts from Pipedrive. Please note that incoming accounts cannot be filtered, and any "fetch" operation will pull all accounts from Pipedrive. In order to fetch only a subset, you must remove the unwanted Accounts from Pipedrive.

Accounts are fetched by either clicking "Actions" and manually triggering a fetch operation, or by incoming webhook. Pipedrive provides a feature that fires account creation and attribute change events to Hull. Once the connector is setup, the data begins to flow between systems, Pipedrive will begin to send these webhooks to Hull. As with manual fetches, incoming accounts cannot be filtered. If you wish to not import accounts into Hull, you must remove them from Pipedrive.

- **incoming account identity** - specify which `Pipedrive Organization Properties` we will use to identify `Hull Account`
- **incoming account attributes** - defines which `Pipedrive Organization Properties` are stored in `Hull Account Attributes` and the fields they are mapped to.


## Supported Objects
The Pipedrive connector allows you to synchronize data between Hull and Pipedrive for the following objects:

|Hull Entity|Pipedrive Entity|
|-----------|--------------|
|User       |Person      |
|Account    |Organization       |

No other objects besides the ones listed above are supported. If you need to synchronize additional objects please reach out to our customer success team to explore the options on a case-by-case basis.

## Edge Cases
### Email as an identifier
In Pipedrive, you may assign a Person multiple email addresses. By default we pick the email marked as Primary in the list to be the representative email in Hull. So please be careful if you are shuffling the emails in Pipedrive.


## Troubleshooting

### I didn't get any Pipedrive organization/person data in Hull
- Check the identifiers which you specified in the settings. Do those identifiers exist in Pipedrive?
- Make sure you've specified attributes in the incoming attributes in the settings page. If you set the attributes after you performed a full fetch, you may have to perform a full fetch again to retrieve all of the newly mapped attributes.
- Check the logs for incoming.user/account.error or incoming.user/account.skip to ensure that there wasn't any additional circumstance which filtered the data
- If you've waited for over 15 minutes, and have checked the above suggestions, please check the Hull Status page at: https://status.hull.io/

### I didn't get any updates from recently updated Persons or Organizations into Hull
Check your connector logs for any `incoming.job.error`. If you see any with `Unauthorized` go to the `Credentials` Tab and perform the OAuth flow authorization again. Make sure that you are linking the connector again to the same Pipedrive account. Changing the account on a once installed connector can lead to data corruption. This operation does not reset any settings from the connector.
Right after it's done, the incoming data flow should be resumed. You can verify that by searching for any `incoming.user.success` or `incoming.account.success` log lines (it can take around 5 minutes to show up).
To fill in any missing data you can use `Fetch All Persons` and `Fetch All Organziations` button which can be viewed by clicking the "Actions" button in the overview page. Be careful if you have a lot of data as this action will trigger a full fetch from Pipedrive.

### I don’t see recently added/updated fields in Pipedrive
You may explicitly send particular users and accounts by searching for them in the Hull web app, and clicking the checkbox on the left side of each row. Then, in the upper right hand corner of the interface you can click "Send to" and specify which connector you want to send the users/accounts to.

### I get empty Accounts
First check to see that the incoming account attributes are set. You may not have set any attributes to pull into Hull. In this case, we will only pull in the Pipedrive identifier.

Ensure that you have executed a full persons and organization fetch by clicking "Actions" in the overview tab of the connector. Please be careful with this operation if you have a lot of data in Pipedrive. It may be that the system hasn't yet pulled all the data from Pipedrive. If it's been over an hour since the full fetch has been called, please check the logs for incoming.account.error or incoming.user.error.
