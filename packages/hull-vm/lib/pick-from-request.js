// @flow
import _ from "lodash";
import type { HullIncomingHandlerMessage } from "hull";
import type { Payload } from "../types";

const pickValuesFromRequest = ({
  body,
  headers,
  cookies,
  ip,
  method,
  params,
  query
}: HullIncomingHandlerMessage): Payload => ({
  body,
  cookies,
  ip,
  method,
  params,
  query,
  headers: _.omit(headers, [
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-newrelic-id",
    "x-newrelic-transaction"
  ])
});

export default pickValuesFromRequest;
