# Outreach Connector

"https://api.outreach.io/api/v2/docs#getting-started"

Note that large offsets on large collections can cause a significant performance hit. For this reason we enforce a maximum offset of 10,000. To work around this limitation, consider using more specific filter criteria or paging across ranges of IDs.


## Getting Started

To install this connector, go to your Hull Dashboard and select `Outreach` from the list of available connectors.
For more information about the configuration of this connector, see the [User Guide](./assets/readme.md).

## Connector development

This section describe technical aspects of the connector code. If you are looking for the customer usage documentation please refer the `Getting Started` section above.

This is a high level overview how to work with this project. Full documentation is available in the [hull-connector-template project](https://github.com/hull/hull-connector-template#connector-development).

### Repository structure

This is a basic repository structure descibed.
For full infromation please go to [Repository structure](https://github.com/hull/hull-connector-template#repository-structure).

```text
root/
  assets/ - Images, Logos and User Guide (readme.md)

  flow-typed/ - Flow type definitions

  server/    - Server-side code for the connector
    actions/ - Route handlers for express application
    lib/     - Business logic of the connector
      sync-agent.js

  src/ - Front-end application which will be served by the backend application

  test/
    integration/ - Integration tests
      fixtures/  - Fixtures for notifications, payloads, etc.
      helper/    - Mocking helpers for tests
      scenarios/ - Expectations and inputs for various test scenarios
    unit/        - Unit tests
```

### Developing

To successfully build the sources on your machine, make sure that you have the correct version of node along with one package manager installed. See `engines` in [package.json](/package.json) for details.

### Testing/Debugging

Execute `yarn run test` or `npm run test` in the repository root to run all tests.

If you want to run the connector on your local machine, execute `yarn run start:dev` or `npm run start:dev` which will start a new node server.
Make sure to set the proper environment variables when running the code locally.

## Running and writing tests

There are two sets of tests, unit tests and integration tests. Please use unit tests for all features testing. The purpose of integration tests is just end-to-end validation of functionality on sample applications.

Integration tests for the `SyncAgent` are organized in scenarios. Please see the [Test Scenarios Guide](/test/integration/scenarios/README.md) for a detailed description of the scenarios.

## Branches

- We follow the [Git Flow](http://nvie.com/posts/a-successful-git-branching-model/) model.
- [master](git://github.com/hull-ships/hull-outreach/tree/master) has the _latest_ version released.
- [develop](git://github.com/hull-ships/hull-outreach/tree/develop) has the code for the _next_ release.

## Changelog

The changelog is located at the root of this repository, see [CHANGELOG.md](/CHANGELOG.md).

### Building

Once you have the prerequisites installed, execute `yarn run build` or `npm run build` in the repository root to build the project locally.
