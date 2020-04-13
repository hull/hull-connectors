# Hull Snowflake Connector

The Hull Snowflake Connector makes it easy to bring data from your Snowflake data warehouse into Hull by  writing your own queries.

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Snowflake importer card. After installation, switch to the “Settings” tab and begin with the configuration.

Begin your configuration in the section **Database Connection** by specifying your snowflake account name, region, and the name of your snowflake database:
![Getting Started Step 1](./docs/gettingstarted01.png)

Move on to the section **Database Login** and specify the user credentials:
![Getting Started Step 2](./docs/gettingstarted02.png)

To complete your configuration, save your changes to the settings. You can now move on to the tab “Query Editor” and write your Snowflake query:
![Getting Started Step 3](./docs/gettingstarted03.png)

Click on the button “Preview” to check if your query is working and delivering the results you expect. Once you are satisfied with the result, save your changes. The Snowflake connector will run the query on a given interval (3 hours per default) once you enable the sync (see Synchronize data on a scheduled basis for further details). If you want to start the import directly, click on the button “Import everything” and we will get you going right away.

### IMPORTANT: when specifying Hull integrated keys like external_id, account_id etc... Please wrap the field name in quotes like this: select someid as "external_id"...  Snowflake returns columns in uppercase by default and if you don't wrap the Hull specific keys in quotes, then it won't be recognized or imported

## Features

The Snowflake connector supports to `create users`, `add traits` and `update traits`.

You can bring in new users or update existing user profiles from your Snowflake databases to create segments, transform and enrich customer data and send them to other services with our other Connectors.

Hull Snowflake Connector allows you to synchronize data on a given schedule, define how data is treated in terms of conflicts and run incremental queries.

## Synchronize data on a scheduled basis

**Enable Sync** to run your query on a given time interval to keep your data automatically up-to-date:
![Synchronize Data](./docs/syncschedule01.png)

By checking the box your query runs automatically every 3 hours. To increase performance we recommend to use incremental queries.

Note: You can always manually run your query from the dashboard by clicking on the button “Import everything”.

## Define behavior in case of a data conflict

A user profile in Hull is usually composed of data from a multitude of sources, so it is likely that you have already stored a value for a given trait and your Snowflake data source returns a different value. Let’s say you have already stored the phone number 123-444-6666 in the user profile for Brad Smith but your query returns the number 456-233-8899. This represents a typical data conflict and you can decide how the Snowflake connector shall resolve this conflict: either keep the number or overwrite it. By selecting **Use Snowflake value in case of data conflict** in the connector configuration section, you make the decision that your Snowflake data source is the leading system for the particular traits it returns:
![Handle Data Conflicts](./docs/dataconflict01.png)
Note: The default behavior is to use the Snowflake value in case of data conflict. This is consistent across all connectors in Hull.

## Query data that has changed in a given time period (Incremental Queries)

If the tables in your Snowflake database hold large sets of data, you might want to query only data that has changed within the last couple of days - this is what we call incremental queries. The advantage of incremental queries is that you return a smaller subset of data that can be processed faster which improves the overall performance. You can write an incremental query by using the placeholder `:import_start_date`  in your query string. The Snowflake connector will automatically replace this at runtime with a proper datetime value that represents the current point of time x days ago. Here is an example of an incremental query:
![Incremental Queries Dashboard](./docs/incrementalqueries01.png)
You can define the number of days on the tab “Settings“ in the section “Connector Configuration”:
![Incremental Queries Settings](./docs/incrementalqueries02.png)
Please enter the number of days as integer or whole number. Fractional days are not supported.
