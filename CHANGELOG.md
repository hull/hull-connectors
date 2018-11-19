# CHANGELOG

## v0.0.5-monorepo
- [hull-typeform] fix mapping submission into `HullUserAttributes`

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
