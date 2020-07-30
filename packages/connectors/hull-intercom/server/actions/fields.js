// @flow

import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");
const PurpleFusionRouter = require("../lib/purple-fusion-router");

const fields = (serviceEntity, direction) => async (
  ctx: HullContext
): HullExternalResponse => {
  const privateSettings = ctx.connector.private_settings;

  if (!_.get(privateSettings, "access_token")) {
    return {
      status: 200,
      data: {
        options: []
      }
    };
  }

  const route = `fields${serviceEntity}${direction}`;

  const router = new PurpleFusionRouter(route);
  return router.invokeIncomingRoute(ctx);
};

module.exports = fields;
