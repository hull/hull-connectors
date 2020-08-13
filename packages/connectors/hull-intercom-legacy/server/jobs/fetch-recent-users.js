// @flow
import type { HullContext } from "hull/src/types/context";

const Promise = require("bluebird");
const moment = require("moment");
const _ = require("lodash");
const { RateLimitError, ConfigurationError } = require("hull/src/errors");

const fetchAllUsers = require("../actions/fetch-all-users");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function fetchRecentUsers(ctx: HullContext, params = {}) {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  const private_settings = ctx.connector.private_settings;

  const { count = 50, page = 1 } = params;
  let { last_updated_at } = params;

  if (!last_updated_at || !moment(last_updated_at).isValid()) {
    if (
      private_settings.last_updated_at &&
      moment(private_settings.last_updated_at).isValid() &&
      moment(private_settings.last_updated_at).isAfter(
        moment().subtract(1, "day")
      )
    ) {
      last_updated_at = private_settings.last_updated_at;
    } else {
      ctx.client.logger.debug("fetchRecentUsers.last_updated_at.fallback", {
        last_updated_at: private_settings.last_updated_at
      });
      last_updated_at = moment()
        .subtract(1, "day")
        .format();
    }
  }

  if (page === 1) {
    ctx.client.logger.info("incoming.job.start", {
      jobName: "fetch-recent",
      type: "users",
      last_updated_at
    });
  }

  ctx.client.logger.debug("fetchUsers", { last_updated_at, page });
  ctx.metric.value("ship.incoming.fetch.page", page);
  return intercomAgent
    .getRecentUsers(last_updated_at, count, page)
    .then(({ users, hasMore }) => {
      const promises = [];

      if ((page + 1) * count >= 10000) {
        if (process.env.ENABLE_FETCH_ALL_FALLBACK) {
          const updated_after = last_updated_at;
          const updated_before = moment(
            _.get(_.last(users), "updated_at"),
            "X"
          ).format();
          ctx.metric.event({
            title:
              "fetchRecentUsers - going to too high page, switching to fetchAllUsers with filtering",
            text: JSON.stringify({ updated_after, updated_before })
          });
          promises.push(fetchAllUsers(ctx, { updated_before, updated_after }));
        } else {
          ctx.metric.event({
            title:
              "fetchRecentUsers - going to too high page, stopping the fetch"
          });
        }
      } else if (hasMore) {
        promises.push(
          fetchRecentUsers(ctx, {
            last_updated_at,
            count,
            page: page + 1
          })
        );
      }

      if (!_.isEmpty(users)) {
        promises.push(syncAgent.saveUsers(users));
      }

      return Promise.all(promises).then(() => {
        ctx.client.logger.debug("fetchRecentUsers.finishedStep", {
          page,
          usersCount: users.length
        });
        if (page === 1 && !_.isEmpty(users)) {
          const newLastUpdatedAt = moment(
            _.get(_.first(users), "updated_at"),
            "X"
          ).format();
          return ctx.helpers.settingsUpdate({
            last_updated_at: newLastUpdatedAt
          });
        }
        return Promise.resolve();
      });
    })
    .catch(RateLimitError, () => Promise.resolve("ok"))
    .catch(ConfigurationError, () => Promise.resolve("ok"))
    .catch(err => {
      if (
        _.get(err, "statusCode") === 429 ||
        _.get(err, "response.statusCode") === 429
      ) {
        ctx.client.logger.debug("service.api.ratelimit", {
          message: "stopping fetch, another will continue"
        });
        return Promise.resolve("skip");
      }
      return Promise.reject(err);
    });
}

module.exports = fetchRecentUsers;
