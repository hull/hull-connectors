# Google Sheets Importer

Google Sheets Importer enables you to perform manual data imports directly from any Google Spreadsheet. That way you can fetch Users, Accounts and User Events coming from any source which can be imported to a sheet.

## Installation

After installing the connector from the gallery you need to install the Hull Add-on in the G-Suite Marketplace.

You can either follow a link exposed in connector settings here:

![Link to add-on](./screenshots/link_to_addon.png)

Or alternative search for it directly in G-Suite Marketplace:

![Go to G-Suite Marketplace](./screenshots/go_to_marketplace.png)

Install the add-on and provide it necessary permissions in order to read content of your spreadsheet and send it to your Hull organization.

![Install Add-on](./screenshots/install_addon.png)

Once the add-on is installed it will be available in the Add-ons menu.

The next step is to connect the add-on with connector by copying and pasting an authorization ticket.
If you open the add-on you will see a sidebar appearing with a welcome screen with a field to save the token:

![Add-on Sidebar initial screen](./screenshots/sidebar_initial_screen.png)

You can obtain the token from Connector settings page:

![Obtain token from connector settings](./screenshots/obtain_token_from_connector.png)

Once the token is saved you will see fields to setup and run your import. You are now ready to use the connector.

## Getting Started

To perform an import on new or existing spreadsheet, at any time you can open the sidebar by going to Add-ons menu:

![Open add-on sidebar](./screenshots/open_addon_sidebar.png)

Sidebar configuration and import operation are always applied and run on current sheet.

Please check our detailed Guides on how to import data in different scenarios:

[Getting Started: Sending data to Hull](https://www.hull.io/docs/guides/getting-started/)

## Settings Reference

### Import Type

Defines entity which will be created during the import based on row data.

In case of User Events import Users still can be created if they were not present in Hull before import. This is required in order to attach events to them correctly.

### Claims

Mapping for user or account identification claims. Defines columns where identifiers are present.
At least one mapping needs to be setup.
Rows without any valid identifier will be skipped.

In case of User Events since they are attached to Users this setting works exactly the same as for Users.

### Event Settings

Only available when Import Type is set to User Events.
This section allows to define how to map additional event related parameters:

- Event Name is a required mapping. Rows without this value will be skipped
- Event Date is optional and will be used as original event creation date on user timeline. Refer [platform documentation](https://www.hull.io/docs/data_lifecycle/ingest/#trait-types) for supported date formats
- Event ID is optional and can be used to prevent duplicating events

### Import Group

Only available when Import Type is set to Users or Accounts.
Define attributes group where all mapped attributes will be stored within.
It can be left blank in order to import top-level attributes.

### Columns Mapping

Defines how to map sheet columns into attributes or event properties.
By default attribute or property name is populated as lower underscore case version of the column name. It can be changed to any name which is accepted by Hull. Refer [platform documentation](https://www.hull.io/docs/data_lifecycle/ingest/#trait-types) for details.
Non mapped columns are ignored.

## Import operation

When import setup is valid and complete an import button at the top becomes active.
If it's inactive that may mean some configuration issues are not resolved.

Before triggering the import some rows needs to be selected in order to be imported. It does not matter which columns are selected. All configured mappings are applied to whole rows.

Text on the button reflects the selection of rows and gives a hint of which rows will be imported.

Once the button is hit the import operation starts and.
