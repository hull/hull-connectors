## Getting Started

Below you will find necessary information how to get started with the Hubspot integration.

### Permissions

You will need administrator permissions to your Hubspot account to perform oAuth authorization.
Make sure you have the correct access before proceeding.

### Add a new Hubspot Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Hubspot`.
3. Confirm the installation by clicking `Install`.
4. Click on `Credentials & Actions` and complete the authorization flow:

  ![oAuth flow first step](./docs/oauth-flow-1.png)

5. Complete the configuration of the Hubspot connector (see section below).


### Configure your Hubspot Connector

There are 4 sections of settings which you can configure depending on what kind of synchronization you need.

### Outgoing Users

- **outgoing user segments** - defines which user segments are sent to Hubspot
- **outgoing user attributes** - defines which `Hull User Attributes` are updated/created on `Hubspot Contact`

### Incoming Users

- **incoming user identity** - specify which `Hubspot Contact Properties` we will use to identify `Hull User`
- **incoming user attributes** - defines which `Hubspot Contact Properties` are stored in `Hull User Attributes`

### Outgoing Accounts

- **outgoing account segments** - defines which account segments are sent to Hubspot
- **outgoing account attributes** - defines which `Hull Account Attributes` are updated/created on `Hubspot Company`
- **outgoing user linking** - defines if Hull will associate `Hubspot Contact` to `Hubspot Company` (see below how the linking is performed)

### Incoming Accounts

- **fetch accounts** - defined if connector will try to read and fetch any `Hubspot Company` information
- **incoming account identity** - specify which `Hubspot Company Properties` we will use to identify `Hull Account`
- **incoming account attributes** - defines which `Hubspot Company Properties` are stored in `Hull Account Attributes`
- **incoming user linking** - defines if Hull will link `Hull User` with `Hull Account` depending on `Hubspot Contact` to `Hubspot Company` association



## Supported Objects
The Hubspot connector allows you to synchronize data between Hull and Hubspot for the following objects:

|Hull Entity|Hubspot Entity|
|-----------|--------------|
|User       |Contact       |
|Account    |Company       |

No other objects besides the ones listed above are supported. If you need to synchronize additional objects please reach out to our customer success team to explore the options on a case-by-case basis.

Accounts synchronization is disabled by default. To enable it you need to setup **fetch accounts** and **outgoing account segments** settings (look above).

## Identity Resolution
The Hubspot connector uses upsert policies for synchronizing data. If we cannot find a matching record, a new one will be created automatically. This section explains how we match existing records between both systems.

### Lookup existing contacts in Hubspot
When synchronizing a Hull user to a `Hubspot Contact` we match both by email. If the outgoing `Hull User` does not have an email address, the synchronization is skipped.

### Lookup existing companies in Hubspot
When synchronizing a `Hull Account` to a `Hubspot Company` we match both by domain. If the account does not have a domain, the synchronization is skipped.

### Lookup existing user in Hull
When synchronizing a `Hubspot Contact` to a Hull user, by default we match both by email. If the contact doesn't have an email, the synchronization is skipped. This behavior can be adjusted using **incoming user identity** setting.

### Lookup existing account in Hull
When synchronizing a `Hubspot Company` to `Hull Account`, we match the account based on your configured strategy. By default, we match both by domain and we skip synchronization if `Hubspot Company` does not have uit.

When adding more identifiers e.g. `external_id`, you can declare if the identifier as required. If required we will skip synchronization for companies which do not satisfy this condition.

**IMPORTANT:** Skip behavior is changed when **incoming user linking** setting is turned on.

## Components

### Synchronization of outgoing data (Hull to Hubspot)

The Hubspot connector receives updates to `Hull Users` and `Accounts` near real-time and makes requests to the Hubspot API. The data synchronization maps the default attributes to Hubspot properties according to the tables below. If you have defined custom properties in Hubspot and configured mappings, the synchronization will also contain these fields.

Additionally you can manually select `Hull Users` or `Accounts` and send them to the connector. This bypass segment filtering and force update of `Hubspot Contacts` and `Companies`.

#### User to Account linking

When the Hubspot connector process update on a `Hull User` profile and:
1. the **outgoing user linking** setting is turned on
2. the `Hull User` is linked to an `Account`
3. linked `Hull Account` was already synchornized to `Hubspot Company` (we know the Hubspot identifier)

it will associate the `Hubspot Contact` with `Company`.

### Synchronization of incoming data (Hubspot to Hull)

The Hubspot connector is built with a sync component, which means we’ll make requests to API on your behalf on a 5 minute interval to fetch the latest data into Hull. In the initial sync, we will fetch all the Hubspot objects (and their corresponding properties) according to the tables below. The data will be written into a separate attribute group hubspot on the respective Hull profile, corresponding to the mapping schema you have defined.


#### User to Account linking

When the Hubspot connector fetch a `Hubspot Contact` and:
1. the **incoming user linking** setting is turned on
2. the `Hubspot Contact` was associated with a `Company`
3. the `Hubspot Contact` satisfy the incoming identity resolution

it will try to link the stored `Hull User` with appropriate `Hull Account`.


**This mean it will create an empty Hull Account which will be only filled in with Hubspot Company data if the Company itself satisfies the incoming identity requirements. If not the Hull User will be linked to an empty Hull Account.**

## Attributes Mappings

Mappings define the attributes of Hull profiles we synchronize with properties of Hubspot. In user and account profiles, the synchronized properties will show under the attribute group hubspot.

< TODO: INSERT TABLES FOR DEFAULTS >


## Troubleshooting

### I don’t get any company data in Hull
check identifiers for accounts

### I don’t get updates of recently updated Contacts or Companies into Hull
Check your connector logs for any `incoming.job.error`. If you see any with `Permission error` go to the `Credentials` Tab and perform the oAuth flow authorization again using the `Start over` button. Make sure that you are linking the connector again to the same Hubspot portal. Changing the portal on once installed connector can lead to data corruption. This operation does not reset any settings from the connector.
Right after it's done the incoming dataflow should be resumed. You can verify that by searching for any `incoming.user.success` or `incoming.account.success` log lines (it can take around 5 minutes to show up).
To fill in any missing data you can use `Fetch all Contacts` and `Fetch all Companies` buttons on the connector tab.

### I don’t see recently added fields
fetch companies or contacts or send them via batch

### I get empty companies
mark identifiers required

### My Hubspot Contact or Companies are not updated due to `duplicate property value` error
If you see `duplicate property value` error in your `outgoing.user.error` or `outgoing.account.error` logs it means that you have duplicate entry in your outgoing attribute mapping. You can inspect `hubspotWriteContact` param in the log line to see the exact payload the connector tried to sent to Hubspot and failed. Search for any property name which appears there twice. Then remove the extra entry in the attributes mapper and resend the affected users/accounts via send to operation.
If you want to achieve fallback strategy for outgoing attributes you need to prepare the value using Processor.
