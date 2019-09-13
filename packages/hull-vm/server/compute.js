// @flow

import type { HullContext } from "hull";
import _ from "lodash";
// import request from "request-promise";
import { Map } from "immutable";
import errors from "request-promise/errors";
import type { Result, ComputeOptions } from "../types";
import getHullContext from "./sandbox/hull";
import javascript from "./backends/javascript";
import jsonata from "./backends/jsonata";

export default async function compute(
  ctx: HullContext,
  computeOptions: ComputeOptions
): Promise<Result> {
  const { client } = ctx;
  const { language, preview, claims, source, entityType } = computeOptions;
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
    claims,
    entityType,
    success: false,
    isAsync: false
  };

  const hull = getHullContext(client, result, source);

  try {
    if (language === "jsonata") {
      await jsonata(ctx, computeOptions, result, hull);
    } else {
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
