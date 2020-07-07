// @flow
import type { HullContext } from "hull/src/types/context";

const moment = require("moment");
const Promise = require("bluebird");
const { RateLimitError, ConfigurationError } = require("hull/src/errors");

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function fetchRecentLeads(ctx: HullContext, params = {}) {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  const private_settings = ctx.connector.private_settings;

  const { updated_before, page = 1, count = 50 } = params;

  let { updated_after } = params;

  if (!updated_after && !updated_before) {
    updated_after =
      private_settings.leads_last_fetched_at ||
      moment()
        .subtract(process.env.LEADS_FETCH_DEFAULT_HOURS || 24, "hours")
        .format();
  }

  if (page === 1) {
    ctx.client.logger.info("incoming.job.start", {
      jobName: "fetch",
      type: "user",
      updated_after,
      updated_before
    });
  }

  return intercomAgent
    .getRecentLeads({
      page,
      count,
      updated_after,
      updated_before
    })
    .then(({ leads, hasMore }) => {
      ctx.client.logger.info("incoming.job.progress", {
        jobName: "fetch",
        stepName: "recent-leads",
        progress: (page - 1) * count + leads.length,
        hasMore
      });
      const promises = [];
      if (hasMore) {
        promises.push(
          fetchRecentLeads(ctx, {
            updated_after,
            updated_before,
            page: page + 1,
            count
          })
        );
      }
      if (leads.length > 0) {
        promises.push(syncAgent.saveLeads(leads));
      }

      if (!hasMore || page % 5 === 0) {
        promises.push(
          ctx.helpers.settingsUpdate({
            leads_last_fetched_at: moment().format()
          })
        );
      }
      return Promise.all(promises);
    })
    .catch(RateLimitError, () => Promise.resolve("ok"))
    .catch(ConfigurationError, () => Promise.resolve("ok"))
    .catch(err => {
      if (err.statusCode === 429) {
        return Promise.resolve("ok");
      }
      return Promise.reject(err);
    });
}

module.exports = fetchRecentLeads;
