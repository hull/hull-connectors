# CHANGELOG

## v0.1.37-monorepo (2020-11-05)
- [hull-bigquery-importer] Bigquery importer

## v0.1.36-monorepo (2020-10-02)
- [hull-facebook-audiences] Migrated to monorepo

## v0.1.35-monorepo (2020-08-25)
- [hull-bigquery] Bigquery mvp

## v0.1.34-monorepo (2020-08-11)
- [hull-google-sheets] Support for events

## v0.1.33-monorepo (2020-07-16)
- [hull-mailchimp] Fetch recent contacts

## v0.1.32-monorepo (2020-07-10)
- [hull-google-sheets] Rework of the google-sheets connector

## v0.1.31-monorepo (2020-07-08)
- [hull-postgres-exporter] Rename Warehouse to Hull PostgreSQL 

## v0.1.30-monorepo
- [hull-salesforce] Moved fetch to purplefusion
- [hull-mailchimp] Improved status update when receiving webhooks

## v0.1.29-monorepo
- [hull-mailchimp] Improved webhook lifecycle
- [hull-mailchimp] Logs user member during warnings and errors

## v0.1.28-monorepo
- [hull-salesforce] add salesforce

## v0.1.27-monorepo
- [hull-typeform] paginate while fetching list of forms when selecting a form

## v0.1.26-monorepo
- [hull-mailchimp] handle archived users

## v0.1.25-monorepo
- [hull-hubspot] jsonata attribute mapper

## v0.1.24-monorepo
- [hull-sql] add sql connector

## v0.1.23-monorepo
- [hull-processor] support for uuid
- [hull-processor] support for libgooglephone

## v0.1.22-monorepo
- [hull-hubspot] sync connector if upsert fails due to mismatched segments

## v0.1.21-monorepo
- [hull-outreach] additional attributes fetched in Outreach events
- [hull-outreach] optimized fetch operations of Outreach events

## v0.1.20-monorepo
- [hull-outgoing-user-webhooks] release
- [hull-outgoing-account-webhooks] release

## v0.1.19-monorepo
- [hull-datawarehouse] support ssh tunnel

## v0.1.18-monorepo
- [hull-coppercrm] merged coppercrm to master
- [hull-hubspot] additional logging for null values

## v0.1.17-monorepo
- [hull-outreach] send users and accounts segments as attributes to Outreach
- [hull-segment] Migrate to monorepo
- [hull-connectors] CircleCI config now publishes docker images and deploys to DCOS
- [hull-repl] Release of Repl connector

## v0.1.16-monorepo
- [hull-hubspot] handle empty contact identity claims
- [hull-hubspot] use vid on contact upsert

## v0.1.15-monorepo
- [hull-connector-framework] add triggers

## v0.1.14-monorepo
- [hull-hubspot] map contact meta data
- [hull-slack] fix account trigger bug

## v0.1.13-monorepo

- [hull-hubspot] store email in Hubspot group
- [hull-hubspot] do not unalias on deletion
- [hull-hubspot] merge contacts and accounts

## v0.1.12-monorepo

- release of the new website connector

## v0.1.11-monorepo

- Moved new and improved code connectors to monorepo master
- added outreach event support
- added zapier connector to master

## v0.1.10-monorepo

- Moved all incoming logging on all connectors to debug level
- Moved outgoing.skip logging to debug for all connectors
- hull-connector-framework removed the replacement of variables by default when no desired output class

## v0.1.9-monorepo

- [hull-pipedrive] New Connector!
- [hull-hubspot] Enhanced fetching reduces number of api calls and number of fetches running in parallel
- [hull-node] Upped timeout to avoid aborted issues when there are many requests in flight
- [hull-outreach] Added ability to pull stageName and ownerEmail
- [hull-connector-framework] Refactored service engine, also added new transform logic

## v0.1.8-monorepo

- [hull-hubspot] support entity deletions

## v0.1.7-monorepo

- mailchimp now defaults to not pulling events on user updates
- disable incoming webhooks when connector is disabled

## v0.1.6-monorepo

- kraken level filtering on segment for Hubspot/Outreach/Customerio/Mailchimp

## v0.1.5-monorepo

- hubspot filtering unneeded updates

## v0.1.4-monorepo

- merge hubspot incoming events

## v0.1.3-monorepo

- Merging new Marketo connector to master branch
- Merging new Warehouse connector to master branch
- Consolidated filtering logic from previous master with new filtering logic
- moved purplefusion to hull-connector-framework

## v0.1.2-monorepo

- Using connector name inferred from manifest and new hubspot doc

## v0.1.1-monorepo

- Updated status for mail chimp so that we have more ok, when things don't deserve warnings

## v0.1.0-monorepo

- Updated the server configuration to load using the manifest and a config object
- Added flow types
- Added support for new oauth workflow

## v0.0.21-monorepo

- [hull-hubspot] updated settings to the new ui
- [hulloutreach] now sending account along with user on batch calls if link_user_in_service is specified

## v0.0.20-monorepo

- [hull-outreach] Added conditional array logic and hotfixes for retrying on outreach errors

## v0.0.19-monorepo

- [hull-outreach] Added authentication permission to get stage

## v0.0.18-monorepo

- [hull-outreach] Added the ability to set and get stage and owner
- [hull-hubspot] Added ability to batch send accounts to hubspot

## v0.0.17-monorepo

- [hull-outreach] fixed re-authentication after 4 hours, fixed memory leak on initial fetch
- [hull-hubspot] updated status messaging

## v0.0.16-monorepo

- [hull-customerio] new logo assets, doc changes and some visual updates to manifest
- [hull-hubspot] updates to view layer, organized manifest better, updated descriptions in manifest
- [hull-mailchimp] usability updates, manifest adding auth to tabs

## v0.0.15-monorepo

- [hull-hubspot] set default max cache pool size

## v0.0.14-monorepo

- [hull-hubspot] updated status messaging and logic for surfacing warning and errors

## v0.0.13-monorepo

- [hull-outreach] New outreach connector with new framework

## v0.0.10-monorepo

- [hull-customerio] migrated into monorepo
- [hull-hubspot] new documentation

## v0.0.9-monorepo

- [hull-mailchimp] breaking change in the settings -> migrated to standard
- make use of `fireAndForget` option in schedule endpoints
- cleanup of manifest.json settings

## v0.0.8-monorepo

- [hull-hubspot] new version with accounts support and test coverage
- [hull-client] flow types fixes
- [hull-connector-framework] require manifest json file to be passed in for the tests
- [hull-connector-framework] add support for the batch endpoint testing
- [hull] add `manifest` content to the connector config
- [hull] introduce trimming `traits_` from outgoing user notifications/batch and from connector settings
- [hull] incoming claims builder
- [hull] introduce `fireAndForget` option on `scheduleHandler`
- [hull] apply defaults to the connector object
- [minihull] introduce better fixtures for `user_reports/bootstrap` and `account_reports/bootstrap` endpoints
- [monorepo] version bump script also update all manifest.json files

## v0.0.7-monorepo

- Migrate Typeform Incoming Attribute Mapping format

## v0.0.6-monorepo

- remove malicious npm package: flatmap-stream@^0.1.0

## v0.0.5-monorepo

- [hull-typeform] fix mapping submission into `HullUserAttributes`
- [hull-typeform] introduce `trait-mapping` setting to handle incoming mapping
- [hull] transient error instrumentation cleanup

## v0.0.4-monorepo

- [hull] bring back timeout default to 25s

## v0.0.3-monorepo

- [hull-mailchimp] moved into monorepo
- [hull-connector-framework] test runner is able to test incoming webhooks and worker jobs
- [hull-connector-framework] test runner verifies all `platformApiCalls`
- [hullrepl] fix building the HullContext object
- [hull] debug whole unhandled error stack, not only the name
- [hull] renamed `requestsBufferHandler` into `incomingRequestHandler` and simplify it's behavior
- [hull] notification handler now responds 200 and retry in case of `ConfigurationError`
- [hull] more flow types
- [minihull] introduced `stubConnectorNotFound` method to test deleted connector scenarios
- [monorepo] disabled caching for babel-node with register hook (causing problem for some CI tests)
- [monorepo] add `--inspect` flag to development startup script so we can inspect with chrome dev tools

## v0.0.2-monorepo

- [hull-typeform] more integration tests, verify ident from hidden fields.
  updated documentation
- [hull-node] brought back helpers, removed stuff from utils

## v0.0.1-monorepo

- initial version of the monorepo
- [hull-typeform] new version working with upgraded Typeform API
