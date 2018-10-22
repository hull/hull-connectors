const SyncAgent = require("../lib/sync-agent");

function tokenCheckAction(deps: Object) {
  const { clientID, clientSecret } = deps;

  return function tokenCheck(ctx) {
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.checkToken(clientID, clientSecret);
  };
}

module.exports = tokenCheckAction;
