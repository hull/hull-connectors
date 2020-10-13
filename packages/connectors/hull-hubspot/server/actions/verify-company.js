// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

const verifyCompany = async (
  ctx: HullContext,
  _incomingMessage: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { body } = _incomingMessage;
  const { company_id, user_identity, account_identity } = body;

  if (
    !company_id ||
    (_.isEmpty(user_identity) && _.isEmpty(account_identity))
  ) {
    return {
      status: 422,
      data: {
        message:
          "Missing Required Parameters: 'company_id', Hull 'user_identity' or Hull 'account_identity'"
      }
    };
  }
  const syncAgent = new SyncAgent(ctx);
  let company;
  try {
    company = await syncAgent.verifyCompany(company_id);
  } catch (error) {
    const { status } = error;
    if (status === 404) {
      if (!_.isEmpty(user_identity)) {
        ctx.client
          .asUser(user_identity)
          .traits({ "hubspot/associatedcompanyid": null });
      }

      if (!_.isEmpty(account_identity)) {
        ctx.client.asAccount(account_identity).traits({ "hubspot/id": null });
      }
    }
  }
  return {
    status: 200,
    data: company
  };
};

module.exports = verifyCompany;
