// @flow

import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");
const PurpleFusionRouter = require("../lib/purple-fusion-router");

const fetchAll = serviceEntity => async (
  ctx: HullContext
): HullExternalResponse => {
  const privateSettings = ctx.connector.private_settings;

  if (!_.get(privateSettings, "access_token")) {
    ctx.client.logger.info("incoming.job.skip", {
      jobName: `fetch${serviceEntity}`,
      reason: "Connector is not or not properly authenticated."
    });
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  }

  const route = `fetchAll${serviceEntity}`;

  const router = new PurpleFusionRouter(route);
  await router.invokeIncomingRoute(ctx);

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
};

module.exports = fetchAll;
