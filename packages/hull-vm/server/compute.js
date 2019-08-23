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
  { payload, code, preview, claims, source, entity = "user" }: ComputeOptions
): Promise<Result> {
  const { connector, client } = ctx;
  const result = {
    logs: [],
    logsForLogger: [],
    errors: [],
    userTraits: Map({}),
    userAliases: Map({}),
    accountTraits: Map({}),
    accountAliases: Map({}),
    accountLinks: Map({}),
    events: [],
    success: false,
    isAsync: false
  };

  const sandbox = {
    responses: [],
    errors: result.errors,
    request: getRequest(result)
  };
  const hull = getHullContext(client, result, source);
  const frozen = {
    ...payload,
    ...LIBS,
    ...(claims ? scopedUserMethods(payload) : {}),
    hull: _.size(claims)
      ? (entity === "account" ? hull.asAccount : hull.asUser)(claims)
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
          (entity === "account" ? hull.asAccount : hull.asUser)(claims),
          "traits",
          "track"
        ),
        (lib, key: string) => vm.freeze(lib, key)
      );
    }

    responses = vm.run(`
      responses = ${check.wrapCode(code)}
      responses;
    `);
  } catch (err) {
    result.errors.push(err.stack.split("at ContextifyScript")[0]);
  }

  if (preview) {
    // Only lint in Preview mode.
    const syntaxErrors = check.invalid(ctx, code);
    if (syntaxErrors.length) {
      result.errors.push(..._.map(syntaxErrors, "annotated"));
    }

    const linterErrors = check.lint(ctx, code);
    if (linterErrors.length) {
      result.errors.push(...linterErrors);
    }
  }

  if (
    result.isAsync &&
    (!responses || !responses.then || !_.isFunction(responses.then))
  ) {
    result.errors.push(
      "It seems you’re using 'request' which is asynchronous."
    );
    result.errors.push(
      `You need to return a 'new Promise' and 'resolve' or 'reject' it in your 'request' callback:

      return request(xxxx).then((res) => {
        const something = response //some-processing;

      })`
    );
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
