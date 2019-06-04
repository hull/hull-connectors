// @flow

import { VM } from "vm2";
import type { HullContext } from "hull";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import rp from "request-promise";

import type { Result, ComputeOptions } from "../types";
import getHullContext from "./sandbox/hull";
import getRequest from "./sandbox/request";
import getConsole from "./sandbox/console";

const LIBS = { _, moment, urijs, rp }
export default async function compute(
  ctx: HullContext,
  { context, code, preview }: ComputeOptions
): Promise<Result> {
  const { connector, client } = ctx;
  const result = {
    logs: [],
    logsForLogger: [],
    errors: [],
    userTraits: [],
    accountTraits: [],
    events: [],
    accountLinks: [],
    success: false,
    isAsync: false
  };

  const sandbox = {
    payload: {},
    responses: [],
    errors: result.errors,
    request: getRequest(result),
  };
  const frozen = {
    hull: getHullContext(client, result),
    console: getConsole(result, preview),
    ...context,
    connector,
    ship: connector
  }

  try {
    const vm = new VM({
      sandbox
      // , timeout: 1000 //TODO: Do we want to enforce a timeout here? what about Promises.
    })
    _.map(LIBS, (lib, key) => {
      console.log("Freezing", key);
      vm.freeze(lib, key)
    });
    _.map(frozen, (lib, key) => {
      console.log("Freezing", key);
      vm.freeze(lib, key)
    });
    vm.run(`responses = (function() { "use strict"; ${code} }());`);
  } catch (err) {
    result.errors.push(err.stack.split("at ContextifyScript")[0]);
  }
  const { responses } = sandbox;
  if (
    responses.length &&
    result.isAsync &&
    !_.some(_.compact(responses), r => _.isFunction(r.then))
  ) {
    result.errors.push(
      "It seems you’re using 'request' which is asynchronous."
    );
    result.errors.push(
      `You need to return a 'new Promise' and 'resolve' or 'reject' it in your 'request' callback:

      return new Promise((resolve, reject) => {
        request(xxxx, function(response){
          const something = response //some-processing;
          resolve(something)
        })
      });`
    );
  }

  try {
    // If we returned a Promise, await until we've got resolved it.
    // If it's not a promise we'll continue immediately
    await Promise.all(responses);
    // Slice Events to 10 max
    if (preview && result.events.length > 10) {
      result.logs.unshift(result.events);
      result.logs.unshift(
        `You're trying to send ${
          result.events.length
        } 'track' calls at a time. We will only process the first 10`
      );
      result.logs.unshift(
        "You can't send more than 10 tracking calls in one batch."
      );
      result.events = _.slice(result.events, 0, 10);
    }
    result.success = true;
  } catch (err) {
    result.errors.push(err.toString());
  }
  return result;
}
