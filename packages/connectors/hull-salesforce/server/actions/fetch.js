import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");

const SyncAgent = require("../lib/sync-agent");
const { fetchChanges } = require("../lib/sync-agent/actions/incoming/fetch/fetch-changes");

async function fetchAction(ctx: HullContext): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  const privateSettings = ctx.connector.private_settings;

  if (!_.get(privateSettings, "instance_url") ||
    !_.get(privateSettings, "access_token") ||
    !_.get(privateSettings, "refresh_token")) {
    ctx.client.logger.info("incoming.job.skip", { jobName: "fetch", reason: "Connector is not or not properly authenticated." });
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  }

  await fetchChanges({ privateSettings, syncAgent })
    .catch((err) => {
      ctx.client.logger.error("incoming.job.error", { job: "fetch", message: err.message, status: err.status });
    });

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = fetchAction;
