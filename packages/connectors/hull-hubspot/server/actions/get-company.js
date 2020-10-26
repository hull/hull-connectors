// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";

const SyncAgent = require("../lib/sync-agent");

const getCompany = async (
  ctx: HullContext,
  _incomingMessage: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { body } = _incomingMessage;
  const { company_id, domain } = body;

  if (!company_id && !domain) {
    return {
      status: 422,
      data: {
        message: "Missing Required Parameters: 'company_id' or 'domain'"
      }
    };
  }
  const syncAgent = new SyncAgent(ctx);
  const company = await syncAgent.getCompany({ id: company_id, domain });
  return {
    status: 200,
    data: company
  };
};

module.exports = getCompany;
