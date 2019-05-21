// @flow
import type { HullContext, HullStatusResponse } from "hull";
import check from "syntax-error";
import _ from "lodash";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { code } = private_settings;
  if (!_.get(code)) {
    return {
      status: "setupRequired",
      messages: [
        "No code is stored. Start by sending a webhook and writing some code"
      ]
    };
  }

  const err = check(code);
  if (err) {
    return {
      status: "error",
      messages: ["Your code seems to have errors."]
    };
  }

  return { messages: [], status: "ok" };
}
