const Promise = require("bluebird");
const _ = require("lodash");

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function fetchAllLeads(ctx, params = {}) {
  const { scroll_param } = params;

  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  if (_.isEmpty(scroll_param)) {
    ctx.metric.event({
      title: "fetchAllLeads"
    });
  }

  const importType = "contacts";
  return intercomAgent
    .importUsers(importType, scroll_param)
    .then(({ users, scroll_param: next_scroll_param }) => {
      if (!next_scroll_param) {
        return Promise.resolve();
      }
      return Promise.all([
        fetchAllLeads(ctx, { scroll_param: next_scroll_param }),
        syncAgent.saveLeads(users, params)
      ]);
    });
}

module.exports = fetchAllLeads;
