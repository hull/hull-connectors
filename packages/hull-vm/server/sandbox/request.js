// @flow
import request from "request-promise";
import type { HullContext } from "hull";

export default function getRequest(ctx: HullContext): any => any {
  return async function req(...args) {
    ctx.metric.increment("connector.service_api.call");
    return request.defaults({ timeout: 3000 })(...args);
  };
}
