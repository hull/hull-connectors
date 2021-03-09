// @flow
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";

const _ = require("lodash");

const SyncAgent = require("../lib/sync-agent");

const getContact = async (
  ctx: HullContext,
  _incomingMessage: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { body } = _incomingMessage;
  const { email, contact_id, utk, save_contact = false } = body;

  if (!email && !contact_id && !utk) {
    return {
      status: 422,
      data: {
        message: "Missing Required Parameter: 'email', 'contact_id' or 'utk'"
      }
    };
  }
  const syncAgent = new SyncAgent(ctx);

  let contact;
  try {
    contact =
      contact_id || email
        ? await syncAgent.getContact({ id: contact_id, email })
        : await syncAgent.getVisitor({ utk });

    if (save_contact && !_.isNil(contact)) {
      await syncAgent.initialize();
      await syncAgent.saveContact(contact);
    }
  } catch (error) {
    return {
      status: 500,
      error: error.message
    };
  }

  return {
    status: 200,
    data: contact
  };
};

module.exports = getContact;
