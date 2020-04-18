// @flow

import _ from "lodash";
import type { HullContext } from "hull";
import jsonataEngine from "jsonata";
import type { ComputeOptions } from "../../types";

export async function jsonata(
  ctx: HullContext,
  { code, payload }: ComputeOptions
) {
  try {
    return jsonataEngine(code).evaluate(payload);
  } catch (err) {
    throw new JsonataError(
      err.message,
      _.pick(err, "message", "code", "position", "token", "value")
    );
  }
}
type Context = {
  code?: string,
  position?: string,
  token?: string,
  value?: string
};

export class JsonataError extends Error {
  code: string;

  context: Context;

  constructor(message: string, context: Context) {
    super(message);
    this.name = "JsonataError"; // compatible with http-errors library
    this.code = "JSONATA_ERROR"; // compatible with internal node error
    this.context = context;

    Error.captureStackTrace(this, JsonataError);
  }
}
