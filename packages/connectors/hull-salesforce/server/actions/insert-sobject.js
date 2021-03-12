/* @flow */
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";

const _ = require("lodash");

const SyncAgent = require("../lib/sync-agent");

const insertSObject = () => async (
  ctx: HullContext,
  incomingMessage: HullIncomingHandlerMessage
): HullExternalResponse => {
  // const { cache } = ctx;

  const sObjectWrapper = _.get(incomingMessage, "body", {});
  const { resourceType, record = {} } = sObjectWrapper;
  if (!resourceType || _.isEmpty(record)) {
    return {
      status: 400,
      data: {
        message: "Required params: resourceType, records"
      }
    };
  }

  /* const lockCacheKey = `lock${resourceType}${requestId}`;
  const lock = await cache.get(lockCacheKey);
  if (lock) {
    return {
      status: 200,
      data: {
        message: "Entity already inserted"
      }
    };
  }
  await cache.set(lockCacheKey, "locked", { ttl: 5 });*/

  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.insertSfObject(resourceType, [record]);

  return {
    status: 200,
    data
  };
};

module.exports = insertSObject;
