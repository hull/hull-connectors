// @flow
import type { HullContext } from "hull";

export default function getSuperagent(ctx: HullContext): any => any {
  const { request } = ctx;

  const rq = request.timeout({
    response: 3000
  });

  return {
    ...rq,
    get: (...args) => {
      ctx.metric.increment("connector.service_api.call");
      return rq.get(...args);
    },
    post: (...args) => {
      ctx.metric.increment("connector.service_api.call");
      return rq.post(...args);
    },
    delete: (...args) => {
      ctx.metric.increment("connector.service_api.call");
      return rq.delete(...args);
    },
    put: (...args) => {
      ctx.metric.increment("connector.service_api.call");
      return rq.put(...args);
    },
    patch: (...args) => {
      ctx.metric.increment("connector.service_api.call");
      return rq.patch(...args);
    }
  };
}
