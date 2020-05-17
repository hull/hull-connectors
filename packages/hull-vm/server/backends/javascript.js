// @flow

import type { HullContext } from "hull";
import { VM } from "vm2";
import moment from "moment";
import urijs from "urijs";
import _ from "lodash";
import type { Result, ComputeOptions } from "../../types";
import scopedUserMethods from "../sandbox/user_methods";
import getRequest from "../sandbox/request";
import getSuperagent from "../sandbox/superagent";
import getConsole from "../sandbox/console";
import getUUID from "../sandbox/uuid";
import getLibPhoneNumber from "../sandbox/libphonenumber";
import check from "../check";

const LIBS = { _, moment, urijs };

export default async function(
  ctx: HullContext,
  { payload, code, preview, claims, entity }: ComputeOptions,
  result: Result,
  hull: any
) {
  const { connector } = ctx;
  const frozen = {
    ...payload,
    ...LIBS,
    ...(claims ? scopedUserMethods(payload) : {}),
    setIfNull: value => ({ operation: "setIfNull", value }),
    increment: value => ({ operation: "increment", value }),
    decrement: value => ({ operation: "increment", value }),
    request: getRequest(ctx, result),
    superagent: getSuperagent(ctx, result),
    LibPhoneNumber: getLibPhoneNumber(),
    uuid: getUUID(ctx, result),
    hull,
    console: getConsole(result, preview),
    connector,
    ship: connector
  };

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
    const scopedClient = (entity === "account" ? hull.asAccount : hull.asUser)(
      claims
    );
    _.map(_.pick(scopedClient, "traits", "track"), (lib, key: string) => {
      const l = function l(...args) {
        result.logs.unshift(
          `Warning. You are using a deprecated method: "${key}()". Please use "hull.${key}()" instead`
        );
        lib(...args);
      };
      vm.freeze(l, key);
    });
  }

  await vm.run(check.wrapCode(code));

  // Only lint in Preview mode.
  if (preview) {
    const syntaxErrors = check.invalid(ctx, code);
    if (syntaxErrors && syntaxErrors.length) {
      result.errors.push(..._.map(syntaxErrors, "annotated"));
    }

    const linterErrors = check.lint(ctx, code, frozen);
    if (linterErrors && linterErrors.length) {
      result.errors.push(...linterErrors);
    }
  }

  return result;
}
