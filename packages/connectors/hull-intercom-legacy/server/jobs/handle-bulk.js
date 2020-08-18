const Promise = require("bluebird");
const _ = require("lodash");

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");
const handleRateLimitError = require("../lib/handle-rate-limit-error");

function handleBulk(ctx, params) {
  const { id, users, attempt = 1 } = params;

  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  return intercomAgent
    .getJob(id)
    .then(({ isCompleted, hasErrors }) => {
      if (isCompleted) {
        ctx.metric.increment("intercom.bulk_job.attempt", attempt);
        return (() => {
          if (hasErrors) {
            return intercomAgent
              .getJobErrors(id)
              .then(data => syncAgent.handleUserErrors(data));
          }
          return Promise.resolve();
        })()
          .then(() => {
            users.map(u => {
              return ctx.client
                .asUser(_.pick(u, ["id", "email", "external_id"]))
                .logger.info("outgoing.user.success");
            });
          })
          .then(() => syncAgent.groupUsersToTag(users))
          .then(groupedUsers => intercomAgent.tagUsers(groupedUsers));
      }

      if (attempt > 20) {
        ctx.metric.increment("intercom.bulk_job.fallback", 1);
        return syncAgent.sendUsers(users, { mode: "regular" });
      }

      return ctx.enqueue(
        "handleBulk",
        { users, id, attempt: attempt + 1 },
        {
          delay: attempt * (parseInt(process.env.BULK_JOB_DELAY, 10) || 10000)
        }
      );
    })
    .catch(err => handleRateLimitError(ctx, "handleBulk", params, err));
}

module.exports = handleBulk;
