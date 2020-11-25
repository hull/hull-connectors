// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";

const SyncAgent = require("../lib/sync-agent");

const getContact = async (
  ctx: HullContext,
  _incomingMessage: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { body } = _incomingMessage;
  const { email, contact_id, utk } = body;

  if (!email && !contact_id && !utk) {
    return {
      status: 422,
      data: {
        message: "Missing Required Parameter: 'email', 'contact_id' or 'utk'"
      }
    };
  }
  const syncAgent = new SyncAgent(ctx);
  const contact =
    contact_id || email
      ? await syncAgent.getContact({ id: contact_id, email })
      : await syncAgent.getVisitor({ utk });
  return {
    status: 200,
    data: contact
  };
};

module.exports = getContact;
