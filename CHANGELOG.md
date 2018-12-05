# CHANGELOG

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
- [hull-repl] fix building the HullContext object
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
