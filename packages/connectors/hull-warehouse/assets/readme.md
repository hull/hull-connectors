## Getting Started

Below you will find necessary information how to get started with the Postgres integration.

## Permissions

You will need a user and password which can create tables (if the tables do not exist) and functions (used to upsert data).  Additionally the user will need permission to alter tables (to add columns when new attributes appear).

## How the Connector Works
The Postgres database connector was created so that a customer can analyze their data using the full power of SQL.  Understandably, as the data grows to billions of records, the queries become more difficult to manage in a postgres environment, but at a scale of millions of rows, most postgres databases are preferred to a more complicated datawarehouse like Redshift or Snowflake   

Once configured, this connector will automatically create 3 tables.  The Account and User tables, which will contain all account and user attributes in columns, in the appropriate table. You may join the tables using the "accountId" field in the User table.

The third table for Events is a static schema which contains the event properties in a json typed column called "properties".

## How Hull Attributes map to columns

The Hull data model is based on a fairly typical NoSql model where attributes can be created as they are ingested.  Postgres by comparison uses a traditional relational model where attributes are modeled as columns.  That means for every new attribute which is ingested by Hull, this connector will create a dedicated column and evolve the tables as the number of attributes grow.
This transformation between databases can result in some specific edge cases.  For instance, the connector is limited by the 1600 column limit which Postgres enforces per table;

#### Attribute Naming
The attribute naming convention within Hull typically follows a convention where all attributes are prefixed by the application which imported the data.  These names are transformed in Postgres to contain the prefix of the application followed by an underscore.

So an attribute in hull which may be called: "salesforce/title" will create a column called "salesforce_title" in postgres.  This means that a unique attribute in Hull which contains an underscore may be overwritten, if there exists a similarly named attribute with a slash instead of an underscore.

#### createdAt/updatedAt
The createdAt and updatedAt columns in the postgres tables are specific to the connector implementation.  If you want to find Hull's internal fields, you'll need to specifically look at created_at and updated_at.   


## Add a new Postgres Connector
1. From your Connectors list in the dashboard, click `Add Connector`.
2. Choose `Postgres Warehouse`.
3. Confirm the installation by clicking `Install`.
4. In the `Settings` tab add the necessary information to connect to the appropriate postgres database


## Outgoing Users

This section outlines the steps in order to send users from Hull to Postgres

- **outgoing user segments** - defines which user segments (and corresponding events) are sent to Postgres, any user which enters one of these segments is sent to Postgres.  You may select "All Users" to ensure that all users are sent to Postgres upon any change.  When first onboarding the connector, once the connection is setup, you should perform a batch "Send to" operation to backfill all users

- User segments are populated in a text field called "segments"

## Outgoing Accounts

This section outlines the steps in order to send accounts from Hull to Outreach (outgoing account data)

- **outgoing account segments** - defines which account segments are sent to Postgres, any account which enters one of these segments is sent to Postgres.  You may select "All Accounts" to ensure that all accounts are sent to Postgres upon any change.  When first onboarding the connector, once the connection is setup, you should perform a batch "Send to" operation to backfill all accounts

- Account segments are populated in a text field called "segments"

## Known Limitations
- Because of the way we automatically evolve the tables to have a column per attribute, you cannot create a view using columns from the account or user table.  Views using columns from the user or account tables interfere with column evolution.
- Because this connector is hosted in Heroku, we are unable to provide a static ip address which the connection will be coming from
- Hull currently does not have the capability to backfill historical events.  Only newly created events will go to the datawarehouse
- Merging is only available for users and user-events. Accounts and accounts-events merging is not available, since account events are not supported in Hull.
