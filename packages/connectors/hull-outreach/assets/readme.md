# Hull Outreach.io Connector

The Outreach.io Connector enables your team to synchronize accounts and users from Hull to accounts and prospects in your Outreach.io system.

## Synchronizing Users with multiple email addresses
In Outreach, the prospect may be associated with multiple emails.  This is a concept that Hull does not currently support.  If multiple emails for a prospect is detected, the platform will attempt to use the "externalId" field in Outreach as the clarifying email.  If "externalId" is empty, then the connector will throw an error requesting customer clarification.

The customer may either remove associated prospect emails so that only 1 email is specified, or specify the primary email in the "externalId" field.


## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Outreach card.

TODO: getting started and configuration


## How it works

TODO: general overview

## Features

TODO: features descriptions

## FAQ

TODO: limitations and other caveats


