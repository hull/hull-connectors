# CHANGELOG

## 2.0.1
* fix signatures of API methods
* rename `Event` to `UserEvent` flow types

## 2.0.0
* enhance the way `logs` and `firehoseEvents` can be captured
* documentation updates

## 2.0.0-beta.3
* fix missing flow types
* documentation adjustments

## 2.0.0-beta.2
*  adds experimental `logsArray` and `firehoseEventsArray` to additionally capture log lines and firehose events to separate arrays.
  CAUTION: this does change normal behaviour of the library (when those arrays are provided logs are not send out to stdout and firehose events are not sent out to the firehose endpoint)
* fix retry callback errors

## 2.0.0-beta.1
* **BREAKING** HullClient is a set of ES6 classes now, not a Function anymore - this means you cannot do `const hullClient = HullClient()` anymore, you always need `new` keyword
* **BREAKING** `as` method is not available anymore, use `asUser`
* **BREAKING** `utils.groupTraits` method is not available anymore, use `utils.traits.group`
* **BREAKING** `traits` method second parameter accepting `source` and `sync` option is not available anymore. Sync calls are not available at all, and if you need to apply `source` to your traits you need to do it before passing payload to `traits` method
* **BREAKING** `hullClient.api.get` methods are not available anymore, use `hullClient.get` or `hullClient.api(path, "get")`, the same applies for all HTTP verbs
* the client now comes with full set of Flow types in src/types.js file
  ```js
  import type { HullUserClaims } from "hull-client";

  const userClaims: HullUserClaims = {
    wrong_claim: "bar"
  };
  // this will throw flow check error since `wrong_claim` is not correct
  ```
* underlying HTTP library restler was replaced with superagent

## 1.2.2
* allow anonymous_id in Account claims

## 1.2.1
* render docs without a TOC so the Website can display them properly.

## 1.2.0
* documentation split into API reference in API.md and getting started and "how-tos" guides in README.md
* cleanup babeljs configuration and use native NodeJS v6 with single babeljs plugin (transform-object-rest-spread) to allow object spread syntax (remove import/export syntax)
* run circleci jobs on all supported nodejs versions
* upgrade of dependencies

## 1.1.5
* retry all 5xx errors

## 1.1.4
* add requestId in logger context

## 1.1.3
* fixes building and publishing process

## 1.1.2
* fixes how API rest client rejects after errors

## 1.1.1
* Add support for custom `scopes` claim in auth tokens

## 1.1.0
* logging api timeouts and failures
* filter out logged claims for users and accounts so one can pass `hull.asUser(user)`
* add `client.as` alias and deprecation notice
* adds identification claims mapping for logger. Since now we can use: `client.asUser({ id, email }).logger("incoming.user.success");`
* adds `firehoseUrl` option to the Hull API client
* background firehose batcher respects `firehoseUrl` param, if not set defaults to `${protocol}://firehose.${domain}`
* adds `Hull-Organization` header to firehose calls
* adds `ip` and `time` context param to traits call

## 1.0.6
* fix `client.utils.traits.group` and deprecates `client.utils.groupTraits`
* improves code structure

## 1.0.0
* extract from `hull-node 0.11.4` - Initial Commit
