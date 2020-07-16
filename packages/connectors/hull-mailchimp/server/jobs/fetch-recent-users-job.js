/* @flow */
const moment = require("moment");
const shipAppFactory = require("../lib/ship-app-factory");

/**
 * SyncIn : import all the list members as hull users
 */
function fetchRecentUsersJob(ctx: any) {
  const { mailchimpAgent } = shipAppFactory(ctx);
  const exclude = ["_links", "members._links"];
  const op = {
    method: "GET",
    path: `/lists/${mailchimpAgent.listId}/members`,
    params: {
      exclude_fields: exclude.join(","),
      since_last_changed: moment
        .utc()
        .subtract({ hours: 24 })
        .format()
    }
  };
  mailchimpAgent.batchAgent.create({
    operations: [op],
    jobs: ["importUsers"],
    chunkSize: 200,
    extractField: "members"
  });
}

module.exports = fetchRecentUsersJob;
