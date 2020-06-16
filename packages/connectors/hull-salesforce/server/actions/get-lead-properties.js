/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

const ENTITY = "lead";

const getLeadProperties = ({ fieldType } = {}) => async (
  ctx: HullContext
): HullExternalResponse => {
  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.getSalesforceProperties({
    entity: ENTITY,
    fieldType
  });
  return {
    status: 200,
    data
  };
};

module.exports = getLeadProperties;
