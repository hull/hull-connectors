// @flow
import type { HullContext, HullExternalResponse } from "hull";
import fetchAllLeads from "./fetch-all-leads";
import fetchAllUsers from "./fetch-all-users";

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
    await fetchAllUsers(ctx);
  } else if (intercomEntity === "Lead") {
    await fetchAllLeads(ctx);
  }

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
};

module.exports = fetchAll;
