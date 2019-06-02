// @flow
import _ from "lodash";
import type { HullIncomingHandlerMessage } from "hull";
import type { Payload } from "../types";

const pickValuesFromRequest = (
  payload: HullIncomingHandlerMessage
): Payload => ({
  ...payload,
  headers: _.omit(payload.headers, [
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-newrelic-id",
    "x-newrelic-transaction"
  ])
});

export default pickValuesFromRequest;
