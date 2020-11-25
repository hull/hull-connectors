## Features

The SQL connector supports various types of entities. Select what you want to import in the Settings:
![Getting Started Step 3](./docs/settings.png)

### Entities: Users and Accounts

The SQL connector, when importing the results will `create` or `update` users and accounts that are returned, and will `add` or `update` attributes to the resolved entities. (Update only happens if the Overwrite setting is set)

You can bring in new entities or update existing user profiles from your SQL databases to create segments, transform and enrich customer data and send them to other services with our other Connectors.

If you activate the `Enable Sync` toggle, the Hull SQL Connector will run on a defined schedule automatically, and you to import data on a given schedule. See the section below

You can link Users to Accounts by exposing an `account_id` column in the results of a Users query, which will link the User to the Account's `external_id` in Hull.
