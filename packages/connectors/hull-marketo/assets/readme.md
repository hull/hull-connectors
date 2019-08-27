## Getting Started

Below you will find necessary information how to get started with the Marketo integration.

## Permissions

This connector uses the API to push new leads, fetch existing leads (through the export api), and fetch lead activity.  You may create a new api user or use an existing one to grant Hull access to your Marketo instance.
You may read more about how to obtain api credentials from Marketo at this link: https://developers.marketo.com/rest-api/authentication/

## Add a new Marketo Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Marketo`.
3. Confirm the installation by clicking `Install`.
4. Click on the `Settings` tab and fill out the Credentials section under `Connect with Marketo`

## Configure your Marketo Connector

The following sections describe how to configure the different aspects of the Marketo Connector.  The connector synchronizes Hull Users to Leads.

## User Synchronization

### User - Identity
The Marketo connector allows you to configure a multi-fallback identity strategy.  This identification strategy can be configured in the "User - Identity" section in the settings.  Choose which Hull identifier maps to which Marketo identifier.  For example, if there is another field you wish to use as an identifier, you may click "Add new item" and map an Marketo field to "externalId" and your custom id will be used to resolve users.

For outgoing traffic (Hull -> Marketo) we use the Marketo upsert endpoint to push the user.  The connector will try the identifiers in order and upsert based on the first identifier found.

For incoming traffic (Marketo -> Hull) we will pull the Marketo id as the anonymous id.  As usual, only the attributes which are specified in the incoming user attributes and user identity are synchronized.

### User - Fetching Users from Marketo

This section outlines the steps in order to receive users (leads) from Marketo.  Please note that incoming users cannot be filtered.  In order to fetch only a subset, you must remove the unwanted Leads from Marketo.

The initial fetch from Marketo is a computationally intensive action which requires monitoring by our Customer Success team.  If you would like to backfill your users, then please request the operation from our support team.  When requesting, please note whether you want to back fill a subset of data, or if you want to back fill all attributes.  A subset of attributes may be faster, but if you decide later you want more attributes, then you may have to do a refetch. 

Once the connector is setup, the data begins to flow between systems, Hull will begin to fetch data updates on regular intervals.  As with manual fetches, incoming users cannot be filtered.  If you wish to not import users into Hull, you must remove them from Marketo.  User deletion not currently a supported feature.

- **incoming user attributes** - defines which `Marketo Lead Properties` are stored in `Hull User Attributes`
- **fetch events** - defines whether we fetch events from Marketo.  Events like opened email or email bounced.  Enabling this option may greatly increase the traffic.
- **fetch all attributes on initial fetch** - defines whether on an initial fetch, we will pull all attributes

### User - Sending Users to Marketo

This section outlines the steps in order to send users from Hull to Marketo (outgoing user data)

- **outgoing user segments** - defines which user segments are sent to Marketo, any user which enters one of these segments is sent to Marketo, as is any changes in attributes on those users.  Make sure to configure attributes to be sent to Marketo (below) or nothing (except a shell) will be sent even if the user is in the segment.
- **outgoing user attributes** - defines which `Hull User Attributes` are updated/created on `Marketo Lead` and the field they are mapped to.

## Supported Objects
The Marketo connector allows you to synchronize data between Hull and Marketo for the following objects:

|Hull Entity|Marketo Entity|
|-----------|--------------|
|User       |Lead      |

No other objects besides the ones listed above are supported. If you need to synchronize additional objects please reach out to our customer success team to explore the options on a case-by-case basis.

<B>If you would like Marketo Account support, please contact our solutions team.  Typically there will be account support for Marketo if you have a Salesforce instance which is connected to your marketo instance</B>

## Components

### Synchronization of outgoing data (Hull to Marketo)

The Marketo connector receives updates to `Hull Users` in near real-time and makes requests to the Marketo API. The data synchronization maps the default attributes to Marketo properties according to the tables below. If you have defined custom properties in Marketo and configured mappings, the synchronization will also contain these fields.

Additionally you can manually select `Hull Users` in the Hull web application and send them to the connectorby clicking `Send to`. This will bypass segment filtering and force update of `Marketo Leads`.

### Synchronization of incoming data (Marketo to Hull)

The Marketo connector is built to pull new data from your Marketo instance on a 5 minute scheduled interval.  As always, make sure to populate your Incoming User Attributes and provide a mapping to which fields you want the Marketo data populating.  Our recommended approach is creating new Marketo specific fields for each of the incoming Marketo attributes.

## Edge Cases
### Initial Fetch
Fetching the existing data in Marketo is known for being a complex and time consuming process.  The process involves specifying 30 day increments to export.  By default Hull exports the last 3 years of leads (configurable if needed) which is 36 exports.  These exports can sometimes fail so monitoring is required if particular exports need to be recreated.  In addition, there is a 500MB daily export limit which means that many times these exports may take several days.

This is why we encourage our customers, if an initial import is needed to contact our support team.  That way we can kick off the process and monitor it to completion.

Because the initial fetch is such involved process, we give our customers the option of exporting all of the datapoints over from Marketo.  Typically we let the customer specify the datapoints to be imported.  That's still an option, but we give the additional option to get everything that way you won't have to do another fetch if you missed a needed datapoint.

### Event Support
Because of the volume that some campaigns can produce, we encourage you to share with the support team the frequency and possible size of campaigns that are being executed in Marketo.  That way we can be sure to allocate the proper compute resources during traffic spikes.

Marketo can generate a lot of traffic as campaigns are activated, or attributes are updated.  

## Troubleshooting

### I don’t get any Marketo lead data in Hull
- Check the identifiers which you specified in the settings.  Do those identifiers exist in Marketo?
- Make sure you've specified attributes in the incoming attributes in the settings page.  If you set the attributes after you performed a full fetch, you may have to perform a full fetch again to retrieve all of the newly mapped attributes.
- Check the logs for incoming.user/account.error or incoming.user/account.skip to ensure that there wasn't any additional circumstance which filtered the data
- If you've waited for over 15 minutes, and have checked the above suggestions, please check the Hull Status page at: http://status.hull.io/

### I don’t get updates of recently updated Leads into Hull
Check your connector logs for any `incoming.job.error`. If you see any with `Unauthorized` go to the `Settings` Tab, and confirm that the credentials are correct under the `Connecto to Marketo` section.  Also ensure that the user you've specified has permissions to do user exports and use the API.
Right after it's done the incoming dataflow should be resumed. You can verify that by searching for any `incoming.user.success` or `incoming.account.success` log lines (it can take around 5 minutes to show up).

### I don’t see recently added/updated fields in Marketo
You may explicitly send particular users by searching for them in the Hull web app, and clicking the checkbox on the left side of each row.  Then, in the upper right hand corner of the interface you can click "Send to" and specify which connector you want to send the users/accounts to.

### I get empty Users
Make sure that you've configured the incoming attributes in the `Fetching Users from Marketo` section of the `Settings` Connector tab.
