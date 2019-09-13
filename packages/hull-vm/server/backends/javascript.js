// @flow

import type { HullContext } from "hull";
import { VM } from "vm2";
import moment from "moment";
import urijs from "urijs";
import _ from "lodash";
import type { Result, ComputeOptions } from "../../types";
import scopedUserMethods from "../sandbox/user_methods";
import getRequest from "../sandbox/request";
import getConsole from "../sandbox/console";
import check from "../check";

const LIBS = { _, moment, urijs };

export default async function(
  ctx: HullContext,
  { payload, code, preview, claims, entityType }: ComputeOptions,
  result: Result,
  hull: any
) {
  const { connector } = ctx;
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

  const vm = new VM({
    sandbox: {
      responses: [],
      errors: result.errors
    },
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

  let responses;
  try {
    responses = vm.run(`
      responses = ${check.wrapCode(code)}
      responses;
      `);
  } catch (err) {
    throw err.stack.split("at ContextifyScript")[0];
  }

  if (
    result.isAsync &&
    (!responses || !responses.then || !_.isFunction(responses.then))
  ) {
    result.errors.push(
      "It seems you’re using 'request' which is asynchronous."
    );
    result.errors.push(
      `You need to return a promise:
      return request(xxxx).then((res) => {
        const something = res //some-processing;
      })`
    );
  }

  await Promise.all([responses]);
  return result;
}
