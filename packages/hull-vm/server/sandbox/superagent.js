// @flow
import type { HullContext } from "hull";
import type { Result } from "../../types";

export default function getSuperagent(
  ctx: HullContext,
  result: Result
): any => any {
  const { request } = ctx;
  // ctx.metric.increment("connector.service_api.call");
  const rq = request.timeout({
    response: 3000
  });
  return {
    ...rq,
    get: (...args) => {
      result.isAsync = true;
      ctx.metric.increment("connector.service_api.call");
      return rq.get(...args);
    },
    post: (...args) => {
      result.isAsync = true;
      ctx.metric.increment("connector.service_api.call");
      return rq.post(...args);
    },
    delete: (...args) => {
      result.isAsync = true;
      ctx.metric.increment("connector.service_api.call");
      return rq.delete(...args);
    },
    put: (...args) => {
      result.isAsync = true;
      ctx.metric.increment("connector.service_api.call");
      return rq.put(...args);
    },
    patch: (...args) => {
      result.isAsync = true;
      ctx.metric.increment("connector.service_api.call");
      return rq.patch(...args);
    }
  };
}
