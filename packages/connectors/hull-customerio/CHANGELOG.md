# CHANGELOG

## MOVED TO MONOREPO

## v0.2.6

- log `outgoing.user.deletion` instead of `success` when we are deleting customer in c.io
- upgrade hull-node

## v0.2.5

- [performance] improve requests throttling, introduce `THROTTLE_RATE` and `THROTTLE_RATE_PER` to control rate limit, they are set to maxium possible 30 requests per second

## v0.2.4

- [performance] concurrent requests
- [bugfix] always encode identifiers in URIs to prevent email identifiers causing wrong paths

## v0.2.3

- [maintenance] reenable connector tester
- [maintenance] add option to disable signature validation

## v0.2.2

- [bugfix] update `hull-node` to prevent incorrect smart-notifier responses
- [bugfix] correct event handling for webhooks

## v0.2.1

- [bugfix] prevent hull `id` from over-writing the selected identifier for customer.io

## v0.2.0

- refactor connector code - introduce SyncAgent, better automatic tests and code coverage

## v0.1.11

- safeguad email detection on incoming webhook

## 0.1.10

- rely on `user.created_at` trait instead of calculating it on every update - possible loop condition
- fix incoming webhooks user ident resolution

## 0.1.9

- cast outgoing date traits ending with "_date" and "_at"

## 0.1.8

- make sure we pass account information to attributes mapper and to c.io

## 0.1.7

- upgrade hull to 0.13.10 - should handle unsupported notification channels more gracefully
- upgrade flow and circleci configuration

## 0.1.6

- [hotfix] make the configuration checking middleware respond correctly to smart-notifier

## 0.1.5

- update hull-node version to 0.13.2
- enable smart-notifier in backward compatible way
- make sure that we update `email` even for user which `customerio\created_at` trait

## 0.1.4

- fix for whitelisted segments
- account attributes are sent as distinct attributes rather than a nested object
- updated documentation
- added /status endpoint

## 0.1.3

- replace / with - to fix liquid template issues

## 0.1.2

- set created_at to a timestamp without miliseconds
- set hull_segments as array instead of a concatenated string
- don't save sent traits in customerio subgroup
- unset created_at when deleting user and unset deleted_at then pushing it again

## 0.1.1

- fix outgoing event filtering
- make webhook url token shorter (to fit in 255 C.io limit)
- fix deletion attribute loop

## 0.1.0

- allowing users to send users from Hull to Customer.io service
