// @flow

import { VM } from "vm2";
import type { HullContext } from "hull";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
// import request from "request-promise";
import { Map } from "immutable";
import errors from "request-promise/errors";
import type { Result, ComputeOptions } from "../types";
import getHullContext from "./sandbox/hull";
import getRequest from "./sandbox/request";
import getConsole from "./sandbox/console";
import check from "./check";
import scopedUserMethods from "./sandbox/user_methods";

const LIBS = { _, moment, urijs };
export default async function compute(
  ctx: HullContext,
  { payload, code, preview, claims, source, entityType }: ComputeOptions
): Promise<Result> {
  const { connector, client } = ctx;
  const result: Result = {
    logs: [],
    logsForLogger: [],
    errors: [],
    userTraits: Map({}),
    userAliases: Map({}),
    accountTraits: Map({}),
    accountAliases: Map({}),
    accountLinks: Map({}),
    events: [],
    claims,
    entityType,
    success: false,
    isAsync: false
  };

  const sandbox = {
    responses: [],
    errors: result.errors
  };
  const hull = getHullContext(client, result, source);
  const frozen = {
    ...payload,
    ...LIBS,
    ...(claims ? scopedUserMethods(payload) : {}),
    request: getRequest(result),
    hull: _.size(claims)
      ? (entityType === "account" ? hull.asAccount : hull.asUser)(claims)
      : hull,
    console: getConsole(result, preview),
    connector,
    ship: connector
  };

  let responses;

  try {
    const vm = new VM({
      sandbox,
      timeout: 1000 // TODO: Do we want to enforce a timeout here? what about Promises.
    });
    _.map(frozen, (lib, key: string) => vm.freeze(lib, key));
    // For Processor keep backwards-compatible signature of having `traits` and `track` at top level
    if (_.size(claims)) {
      _.map(
        _.pick(
          (entityType === "account" ? hull.asAccount : hull.asUser)(claims),
          "traits",
          "track"
        ),
        (lib, key: string) => {
          const l = function l(...args) {
            result.logs.unshift(
              `Warning. You are using a deprecated method: "${key}()". Please use "hull.${key}()" instead`
            );
            lib(...args);
          };
          vm.freeze(l, key);
        }
      );
    }

    responses = await vm.run(check.wrapCode(code));
  } catch (err) {
    result.errors.push(err.stack.split("at new Script")[0]);
  }

  if (preview) {
    // Only lint in Preview mode.
    const syntaxErrors = check.invalid(ctx, code);
    if (syntaxErrors && syntaxErrors.length) {
      result.errors.push(..._.map(syntaxErrors, "annotated"));
    }

    const linterErrors = check.lint(ctx, code, frozen);
    if (linterErrors && linterErrors.length) {
      result.errors.push(...linterErrors);
    }
  }

  try {
    // If we returned a Promise, await until we've got resolved it.
    // If it's not a promise we'll continue immediately
    await Promise.all([responses]);
    // Slice Events to 10 max
    if (preview && result.events.length > 10) {
      result.logs.unshift(result.events);
      result.logs.unshift(
        `You're trying to send ${result.events.length} 'track' calls at a time. We will only process the first 10`
      );
      result.logs.unshift(
        "You can't send more than 10 tracking calls in one batch."
      );
      result.events = _.slice(result.events, 0, 10);
    }
    result.success = true;
  } catch (err) {
    if (
      err.error ||
      err instanceof errors.RequestError ||
      err instanceof errors.StatusCodeError ||
      err instanceof errors.TransformError
    ) {
      result.errors.push(
        err.message === "Error: ESOCKETTIMEDOUT" ? err.message : err.error
      );
    } else {
      result.errors.push(err.toString());
    }
  }
  return result;
}
