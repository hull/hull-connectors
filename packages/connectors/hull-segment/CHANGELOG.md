## v0.2.0
- babel 7
- [BREAKING] use consistent behaviour with other connectors: Send nothing by default, both in User and Account udpates
- Use hull-node 0.14 with hull-client-node 2.0.0
- add flow typing
- support account updates.
- Update flow tooling - ensure coverage

## v0.1.19
- Add FLOW_CONTROL_SIZE and FLOW_CONTROL_IN env vars to control smart-notifier behavior

## v0.1.18
- Add smart notifier endpoint

## v0.1.17
- Don't write outgoing.user.skip if no writeKey

## v0.1.16
- Use `timestamp` instead of `originalTimestamp` as `created_at` in tracks handler

## v0.1.15
- hotfix account properties not sent in User when listed there
- cleanup Settings Screen
- change account, page and screen tracking defaults to `true`
- add status checks

## v0.1.14
- upgrade hull-node to v0.13.9

## v0.1.13
- hotfix error

## v0.1.12
- hotfix error reporting
- upgrade hull-node to v0.12.8

## v0.1.11
- add tooling for CircleCI v2
- pass along the `event_id` as `message_id` so Segment can dedupe events

## v0.1.10
- add support for outgoing group calls with account attributes

## v0.1.9
- adds `active` claim only if active flag is set from segment context

## v0.1.8
- set correct maxSize and maxTime values for notifHandler
- adds `active` claim to identify and track handlers to activate fast-lane
- reverts manifest.json settings definition to correct structure

## v0.1.7
- upgrade hull@0.12.6

## v0.1.6
- upgrade hull@0.12.2
- upgrade documentation and settings structure

## v0.1.5
- optionally use redis store for internal caching

## v0.1.4
- set default ttl for caching

## v0.1.3
- hotfix ignore filters on batch
- hotfix public_id field

## v0.1.2
- hotfix the wrong incoming track handler

## v0.1.1
- logging messages updates - levels adjusted and added more ident info

## v0.1.0
- hull-node upgraded to 0.11
- accounts support - enabled via `handle_accounts` setting

## v0.0.4
- standardize log messages
- update Build & Test dependencies
- adds self-hosted installation information

## v0.0.3
- change logs format to JSON

## v0.0.2
- set version of NodeJS to `6.10.0`
