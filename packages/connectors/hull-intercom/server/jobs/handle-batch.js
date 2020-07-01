const _ = require("lodash");
const Promise = require("bluebird");

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function handleBatch(ctx, messages) {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  const private_settings = ctx.connector.private_settings;

  const filteredUsers = [];
  const leadMessages = [];
  const ignoreDeletedUser = _.get(
    private_settings,
    "ignore_deleted_users",
    true
  );
  messages.forEach(message => {
    const { segments, user } = message;
    const updatedUser = syncAgent.updateUserSegments(
      user,
      { add_segment_ids: _.compact(segments).map(s => s.id) },
      true
    );
    const ident = _.pick(updatedUser, ["email", "id"]);
    const deletedAt = _.get(message, "user.traits_intercom/deleted_at", null);
    const canSend = !deletedAt || !ignoreDeletedUser;
    if (message.user["traits_intercom/is_lead"]) {
      if (canSend) {
        leadMessages.push(message);
      } else {
        ctx.client.asUser(ident).logger.debug("outgoing.user.skip", {
          reason: "(Lead) User has been deleted"
        });
      }
    } else {
      ctx.client.asUser(ident).logger.debug("outgoing.user.start");
      if (canSend) {
        filteredUsers.push(updatedUser);
      } else {
        ctx.client.asUser(ident).logger.debug("outgoing.user.skip", {
          reason: "User has been deleted"
        });
      }
    }
  });

  return (() => {
    if (!_.isEmpty(leadMessages)) {
      return syncAgent.sendLeads(leadMessages);
    }
    return Promise.resolve();
  })().then(() => {
    if (!_.isEmpty(filteredUsers)) {
      return syncAgent.sendUsers(filteredUsers);
    }
    return Promise.resolve();
  });
}

module.exports = handleBatch;
