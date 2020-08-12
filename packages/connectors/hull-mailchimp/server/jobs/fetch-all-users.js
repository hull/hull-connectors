/* @flow */
const shipAppFactory = require("../lib/ship-app-factory");

/**
 * SyncIn : import all the list members as hull users
 */
function fetchAllUsers(ctx: any) {
  const { mailchimpAgent } = shipAppFactory(ctx);
  const exclude = ["_links", "members._links"];
  const op = {
    method: "GET",
    path: `/lists/${mailchimpAgent.listId}/members`,
    params: {
      exclude_fields: exclude.join(",")
    }
  };
  return mailchimpAgent.batchAgent.create({
    operations: [op],
    jobs: ["importUsers"],
    chunkSize: 200,
    extractField: "members",
    operationName: this.data.payload.operationName || null
  });
}

module.exports = fetchAllUsers;
