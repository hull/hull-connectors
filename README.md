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

`dotenv -e .env.typeform yarn dev hull-foo`

**How to start connector in production mode?**

`yarn build`
`dotenv -e .env.typeform bash scripts/bash-entrypoint.sh hull-foo`


## Changes

Monorepository has one global version, to apply it use following commands:

`yarn workspaces run version --new-version 0.0.2-monorepo --no-git-tag-version`
`yarn version --new-version 0.0.2-monorepo`

this will update version in all packages, and then bump root package.json,
commit those changes and tag them witht the version.
