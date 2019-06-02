// @flow
import _ from "lodash";
import type { HullIncomingHandlerMessage } from "hull";
import type { Payload } from "../types";

export default function pickValuesFromRequest(
  payload: HullIncomingHandlerMessage
): Payload {
  return {
    ...payload,
    headers: _.omit(payload.headers, [
      "x-forwarded-for",
      "x-forwarded-proto",
      "x-newrelic-id",
      "x-newrelic-transaction"
    ])
  };
}
