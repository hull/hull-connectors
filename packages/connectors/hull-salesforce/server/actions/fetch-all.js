// @flow

import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";
import type { TResourceType } from "../lib/types";

const _ = require("lodash");
const PurpleFusionRouter = require("../lib/purple-fusion-router");

const fetchAll = (sfEntity: TResourceType) => async (
  ctx: HullContext,
  incomingMessage: HullIncomingHandlerMessage
): HullExternalResponse => {
  const fetchParameters = _.get(incomingMessage, "body");

  const privateSettings = ctx.connector.private_settings;

  if (
    !_.get(privateSettings, "instance_url") ||
    !_.get(privateSettings, "access_token") ||
    !_.get(privateSettings, "refresh_token")
  ) {
    ctx.client.logger.info("incoming.job.skip", {
      jobName: "fetch",
      reason: "Connector is not or not properly authenticated."
    });
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  }

  const route = `fetchAll${sfEntity}s`;

  const router = new PurpleFusionRouter(route);
  await router.invokeRoute(ctx, fetchParameters);

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
};

module.exports = fetchAll;
