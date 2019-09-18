# Hull Madkudu Connector

Enables organizations to enrich accounts via MadKudu.

## Getting Started

To install this connector, go to your Hull Dashboard and select `Madkudu` from the list of available connectors.
For more information about the configuration of this connector, see the [User Guide](/assets/readme.md).

## Repository structure

```text
root\
  .circleci - Configuration for CircleCI

  assets\ - Images, Logos and User Guide (readme.md)
    docs - Images and other assets for User Guide

  flow-typed - Flow type definitions

  server\ - Server-side code for the connector
    handlers - Route handlers for express application
    lib\ - Business logic of the connector
      service-client - Utility functions for the service-client

  test\
    integration\ - Integration tests
      fixtures - Fixtures for notifications, payloads, etc.
      helper - Mocking helpers for tests
      scenarios - Expectations and inputs for various test scenarios
    unit - Unit tests
```

## Developing

To successfully build the sources on your machine, make sure that you have the correct version of node along
with one package manager installed. See `engines` in [package.json](/package.json) for details.

## Building

Once you have the prerequisites installed, execute `yarn run build` or `npm run build` in the repository root to build the project locally.

## Testing/Debugging

Execute `yarn run test` or `npm run test` in the repository root to run all tests.

If you want to run the connector on your local machine, execute `yarn run start:dev` or `npm run start:dev` which will start a new node server.
Make sure to set the proper environment variables when running the code locally.

## Running and writing tests

There are two sets of tests, unit tests and integration tests. Please use unit tests for all features testing. The purpose of integration tests is just end-to-end validation of functionality on sample applications.

Integration tests for the `SyncAgent` are organized in scenarios. Please see the [Test Scenarios Guide](/test/integration/scenarios/README.md) for a detailed description of the scenarios.

## Branches

- We follow the [Git Flow](http://nvie.com/posts/a-successful-git-branching-model/) model.
- [master](https://github.com/hull-ships/hull-madkudu/tree/master) has the _latest_ version released.
- [develop](https://github.com/hull-ships/hull-madkudu/tree/develop) has the code for the _next_ release.

## Changelog

The changelog is located at the root of this repository, see [CHANGELOG.md](/CHANGELOG.md).