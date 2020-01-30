// @flow
import request from "request-promise";
import type { HullContext } from "hull";
import type { Result } from "../../types";

export default function getRequest(
  ctx: HullContext,
  result: Result
): any => any {
  return function req(...args) {
    result.isAsync = true;
    ctx.metric.increment("connector.service_api.call");
    return request.defaults({ timeout: 3000 })(...args);
  };
}
