# BigQuery Importer

BigQuery importer allows you to setup an automatic data import based on any BigQuery query. That way you can fetch Users, Accounts, and User Events based on a selected interval.

## Installation

Pick the connector from the connectors gallery. One connector can run one query only so you may need to install multiple connectors.

## Getting started

### Authorization & Setup

After installing the connector from the gallery, you need to authorize it against BigQuery API using Service Accounts.

This requires provisioning a Service Account in your Google Cloud project. This is a one time operation and gives you precise control over what connector can access in your BigQuery data base.





Once this is done you need to define which BigQuery project the connector should work in. This is a single select dropdown.

The final part of the setup is to define what kind of Hull Entity connector should import. You can select users, accounts, and events. Additionally below you can define on which schedule the importer should run the query.


### Writing the query

Once the connector is setup you can navigate to the query editor in the overview screen of the connector.

This is the time to write and verify the query which is the core part of the import process. The connector will run this query on a defined schedule and every result row will be imported as a Hull User, Account, or User Event. The import row can result in creating or updating those entities.

The query result must include at least one column with an identifier. This column will be used to find existing Hull Users or Accounts. Data from every other column will be imported as attributes in a separate group of attributes.

Feel free to write the query either in the connector editor or in the BigQuery console. Once you are satisfied with the structure you can run the preview in connector editor which will show you how data would be imported and if all required identifiers are present.

## Saving query and running import

If the results are correct you can now save the query.
From that moment the connector will run it on schedule interval defined in the settings.

Optionally you can run the import manually right after saving the query. Hit the import button to trigger it.

Every import will run in the background and you can use connector logs to see the progress of incoming data.
