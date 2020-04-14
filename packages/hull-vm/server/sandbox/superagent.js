// @flow
import type { HullContext } from "hull";
import type { Result } from "../../types";

export default function getSuperagent(
  ctx: HullContext,
  result: Result
): any => any {
  const { request } = ctx;
  result.isAsync = true;
  ctx.metric.increment("connector.service_api.call");
  return request.timeout({
    response: 3000
  });
}
