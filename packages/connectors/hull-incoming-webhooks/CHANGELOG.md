# Changelog

## v0.0.14-mnonorepo
- move to monorepo
- add integration tests for dataflow
- add flowtypes everywhere
- refactor to allow extracting VM and unify with other computation connectors
- rebuild entire Frontend to allow redesign
- clarify the way performed calls are displayed
- move from CodeMirror to Ace
- introduce methods with the same signature as the node library (hull.asUser, hull.asAccount)
- fix setting `null` values
- don't collapse multiple `traits` call to just one anymore (for reliability)

## v0.1.6
- prevent malicious flatmap-stream@0.1.1 from installing

## v0.1.5

- fix reducing account traits
- fix logs context (use scoped HullClient instance instead of global one)
- add missing dependencies

## v0.1.4

- do not prefix traits with `traits/`

## v0.1.3

- UI changes
- internal bugfixes
- updated documentation

## v0.1.2

- adds /status endpoint for healthchecks

## v0.1.1

- [hotfix] flow/eslint

## v0.1.0

- [feature] allow to map user's external json payload and send it to hull.
