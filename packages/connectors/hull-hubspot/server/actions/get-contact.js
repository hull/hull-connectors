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
  const { contact_id, utk } = body;

  if (!contact_id && !utk) {
    return {
      status: 422,
      data: {
        message: "Missing Required Parameter: 'contact_id' or 'utk'"
      }
    };
  }
  const id = contact_id || utk;
  const syncAgent = new SyncAgent(ctx);
  const contact = contact_id
    ? await syncAgent.getContact(id)
    : await syncAgent.getVisitor(utk);
  return {
    status: 200,
    data: contact
  };
};

module.exports = getContact;
