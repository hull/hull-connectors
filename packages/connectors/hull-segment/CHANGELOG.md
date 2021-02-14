# CHANGELOG

## v0.1.37

- Move outgoing.user.skip & outgoing.account.skip logs to debug level

## v0.1.36

- Add kraken filtering

## v0.1.35

- Updated ES query for legacy groups support

## v0.1.34

- New Settings

## v0.1.33

- Enable override of default metadata for library used to send events to segment.com

## v0.1.32

- New status messaging, not throwing warnings anymore for cases that may be fine

## v0.1.31

- Will not send all traffic by default unless customer as set the ALL option.  Migrating last customers to the option

## v0.1.30

- Update User filter settings title

## v0.1.29

- upgrade hull-node

## v0.1.28

- [hotfix] updated yarn lockfile with nock dependencies


## v0.1.27

- [hotfix] added new batch unit test to make sure we're hitting the batch endpoint and going through all the appropriate routing logic instead of just hitting the function directly

## v0.1.26

- [hotfix] on batch user update, we should not add hull segments because the platform doesn't send the account segments currently, and sending an empty segment list overwrites the hull-segments in the target system

## v0.1.25

- [hotfix] when domain is in the incoming traits, add it to the account identification as well, that way we're not just using the groupId to identify the account
- [hotfix] additional logging for outgoing account successes and skips

## v0.1.24

- [hotfix] fix `incoming.account.success` loggin

## v0.1.23

- [hotfix] ignore filters on batch requests

## v0.1.22

- [bugfix] make sure that user-events are send out only if given user belongs to filtered segments

## v0.1.21

- [bugfix] add payloads to incoming log lines
- [maintenance] apply styling changes

## v0.1.20

- [bugfix] Add account segments to outgoing group calls as `hull_segments` property
- [bugfix] Add change detection to reduce the amount of outgoing data to segment.com
- [maintenance] Update `manifest.json` and `readme.md` to reflect the changes

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
