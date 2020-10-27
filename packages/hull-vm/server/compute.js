// @flow

import type { HullContext } from "hull";
import _ from "lodash";
import { Map } from "immutable";
import errors from "request-promise/errors";
import type { Result, ResultBase, ComputeOptions } from "../types";
import getHullContext from "./sandbox/hull";
import javascript from "./backends/javascript";
import { jsonata, JsonataError } from "./backends/jsonata";

const debug = require("debug")("hull-vm:compute");

export default async function compute(
  ctx: HullContext,
  { language, payload, code, preview, claims, source, entity }: ComputeOptions
): Promise<Result | ResultBase> {
  const { client } = ctx;
  const result: Result = {
    logs: [],
    logsForLogger: [],
    errors: [],
    data: {} | [],
    success: false,
    isAsync: false,
    userTraits: Map({}),
    userAliases: Map({}),
    accountTraits: Map({}),
    accountAliases: Map({}),
    accountLinks: Map({}),
    events: [],
    claims,
    entity
  };

  const computeOptions = { source, payload, code, preview, claims, entity };
  try {
    if (language === "jsonata") {
      const data = await jsonata(ctx, computeOptions);
      result.data = { ...data };
    } else {
      const hull = getHullContext({ client, result, source, claims, entity });
      await javascript(ctx, computeOptions, result, hull);
    }
    // If we returned a Promise, await until we've got resolved it.
    // If it's not a promise we'll continue immediately
    // Slice Events to 10 max
    if (preview && result.events.length > 10) {
      result.logs.unshift(result.events);
      result.logs.unshift(
        `You're trying to send ${result.events.length} 'track' calls at a time. We will only process the first 10`
      );
      result.logs.unshift(
        "You can't send more than 10 tracking calls in one batch."
      );
    }
    result.events = _.slice(result.events, 0, 10);
    result.success = true;
  } catch (err) {
    debug("Error while running VM (Could be customer code)", err);
    if (
      err.error ||
      err instanceof errors.RequestError ||
      err instanceof errors.StatusCodeError ||
      err instanceof errors.TransformError
    ) {
      result.errors.push(
        err.message === "Error: ESOCKETTIMEDOUT" ? err.message : err.error
      );
    } else if (err instanceof JsonataError) {
      result.errors.push(err.message);
    } else {
      result.errors.push(err.stack.split("at new Script")[0]);
    }
  }
  return result;
}
