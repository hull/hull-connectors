// @flow
import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");

const fetchAll = (intercomEntity: string) => async (
  ctx: HullContext
): HullExternalResponse => {
  const privateSettings = ctx.connector.private_settings;

  if (!_.get(privateSettings, "access_token")) {
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

  if (intercomEntity === "User") {
    await Promise.resolve(ctx.enqueue("fetchAllUsers"));
  } else if (intercomEntity === "Lead") {
    await Promise.resolve(ctx.enqueue("fetchAllLeads"));
  }

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
};

module.exports = fetchAll;
