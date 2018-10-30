# Changelog

## 0.6.1
- new branding

## 0.6.0
- do not sync all segments anymore, just those which are in outgoing segments filter
- during migration period all additional segments will be removed
- fix failing code on empty field mapping entry

## 0.5.11
- use lodash to get account traits

## 0.5.10
- make sure we can use account attributes to map to member merge tags
- adjust configuration to the template
- apply prettier

## 0.5.9
- adjust documentation
- add table with all segments user counts to compare easily the sync state
- minor data flow fix

## 0.5.8
- lint fix

## 0.5.7
- make static segments calls concurrently

## 0.5.6
- set correct `status` and `subscribed` trait values on webhook requests
- add `fetch_user_activity_on_update` hidden setting to turn off on update activity fetching
- save `mailchimp/status` on upsert
- deprecate additional `mailchimp/subscribed` trait in favor of `mailchimp/status`
- adds more instrumentation to upser/update calls

## 0.5.5
- hotfix user update handler

## 0.5.4
- adds `FLOW_CONTROL_*` env variables to control smart-notifier flow control responses
- makes tracking user activites happen after successfull sending users, and makes them run in sequence

## 0.5.3
- fix adding users to static segments via manual batch
- update hull-node to v0.13.10
- fix logging
- adds more metrics

## 0.5.2
- update hull-node to v0.13.9
- adjust metrics

## 0.5.1
- add skip log line for users without email address
- hotfix failing status endpoint

## 0.5.0
- we don't save `mailchimp/import_error` trait anymore
- for notifications we add users only to static segments they just entered, or remove from those which they just left, for batches we just add users to static segments they belong to (there is additional setting `force_removal_from_static_segments` - when enabled connector removes users from all static segments they should not be in)
- we don't filter out notification when user just left filter segments, this allows to untag and remove users from static segments correctly
- we don't recreate static segments and interest groups on segment update event
- set the outgoing chunk size to 500
- added `CONNECTOR_UPDATE_SEGMENT_CONCURRENCY` env var to control concurrency on outgoing static segments update, defaults to 7
- replaced `sendUsers` job with `sendUserUpdateMessages` method on `SyncAgent`
- moved around `SyncAgent` and `ServiceClient`
- added `mailchimp.meanSyncPercentage` metric reported by the status endpoint
- implemented new hull-node flow types and added some of the flow annotations
- other sync flow adjustments and optimizations

## 0.4.4
- don't force stop on some additional errors after sending users

## 0.4.3
- save hull_segments trait with grouping information from Mailchimp
- add skip log lines for batch handler
- add webhooks status check
- add sync error handling

## 0.4.2
- save import error to correct trait
- add incoming users metric

## 0.4.1
- upgraded hull-node to 0.13.5
- added missing static segments and interest groups checks on status endpoint
- adjusted concurrency on deleting static segments and interest groups since it was causing 405 error on MC api
- added `check` option to segment mapping agents to run additional check on ship:update to see any missing static segments and interest groups and ensure they exist on MC API

## 0.4.0
- replaced batch extracts handling with hull-node utility
- renamed `syncIn` job with `fetchAllUsers`
- upgraded hull-node to `0.13.2`
- combined `updateUsers` job into `sendUsers`
- change outbound traffic filtering

## 0.3.2
- hotfix sync operation to request extract for synchronized segments one by one
- added /sync-out endpoint to trigger extracts without recreating static segments or interests groups

## 0.3.1
- hotfix logging ident

## 0.3.0
- upgrade to newest logging convention and hull-node@0.11.8

## 0.2.4
- expose internal `/sync-in` endpoint which can be triggered manually to import only members from Mailchimp

## 0.2.3
- improve loading merge fields from Mailchimp API for dashboard settings pane

## 0.2.2
- fix error handling

## 0.2.1
- be less error-prone about missing properties coming from Mailchimp API

## 0.2.0
1. Added support for configurable attributes mapping
2. Maintenance enhancements:
  - releases information supplied to errors
  - precommit and prepush hooks linked to tests
