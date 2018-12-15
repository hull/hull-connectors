# Hull Connectors

This is a monorepository containing all official Hull connectors
and supporting libraries.

## Setup overview

The repository is configured using `yarn workspaces` feature.

Root of the repository contains:

- workspaces definition in package.json
- linting configuration and dependencies
- building/transpilation configuration and dependencies
- flow types configuration and dependencies
- jest configuration and dependencies
- common production dependencies

Then separate packages are defined here:

- `pacakges/connectors/*/package.json` - connectors
- `packages/*/package.json` - supporting libraries


**How repository is built/linted/flow tested?**

There is one configuration in the root of repository,
the whole project is linted, flow tested and built as one package.
Everything from `packages/*` directory is transpiled into
`dist/*` with the very same structure.
After babeljs build rest of the files such as assets are copied into the `dist`.

**How packages are tested?**

Linting and flow testing is global (look above).
Tests are done in two different ways:

- new tests are using `jest` framework and it's run globally across whole repository
- some of packages are still using deprecated `mocha` framework, so when performing tests, yarn is getting into every package/workspace and run `test` script


## How to add new connector hull-foo?

1. copy the code into `pacakges/connectors/hull-foo`
2. make sure that the `name` in package.json is `hull-foo` (some steps depends on it)
3. remove all unnecessary dev and prod dependencies from `package.json` (look at root package.json to see what can be removed)
4. remove all unnecessary npm/yarn scripts for linting and building
5. plug in testing:
  - if tests are written in deprecated `mocha` framework keep `test` script which runs the mocha tests, but include a special `babel` js file to make sure transpilation is applied: `mocha --require ../../root-babel-register`
  - if tests are written in new `jest` framework go to `jest.config.js` file and add your connector paths
6. make sure that links to hull packages are local:
  ```
  "hull": "link:../../hull",
  "hull-connector-framework": "link:../../hull-connector-framework",
  ```
7. remove all unnecessary configuration files: `.eslintrc`, `.babelrc`, `.editorconfig` etc.


**How to start connector in dev mode?**

First copy the env file and fill it in:
`cp packages/connectors/hull-foo/.env-sample .env.hull-foo`

Then you can start it with the `dev` script:
`dotenv -e .env.hull-foo yarn dev hull-foo`

**How to start connector in production mode?**

First build the production dist:
`yarn build`

Then given you have the env file in place (if not look above), you can use bash script to run:
`dotenv -e .env.hull-foo bash scripts/bash-entrypoint.sh hull-foo`


**How to test single connector?**

Run `jest packages/connectors/hull-foo` if the connector is already on jest.

If on mocha run `yarn workspace hull-foo run test`.

**How to lint single connector?**

Run `eslint packages/connectors/hull-foo`

## Client-side code


**How to build client packages**

Client assets will be built during the `build` phase that's triggered when calling `yarn build`. If you want to manually build a single client package, checkout the section below.

**How to build a single client package**

To build the client files for a package, using Webpack, first ensure your files to be built are in the `/src` folder at the root of the package. (For instance `hull-google-analytics/src`)

Then, run `yarn build:client hull-google-analytics`

The files will be built in the `hull-google-analytics/assets` folder

**How to serve javascript compiled files in Development**

The simplest way is to have your connector rely on `packages/server/server`,
and pass `devMode` to `true` -> The connector will automatically pass the files in `/src` through webpack

## Changes

Monorepository has one global version and changelog.
