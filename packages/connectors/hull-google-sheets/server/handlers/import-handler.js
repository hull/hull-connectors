// @flow
import _ from "lodash";
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import type { ImportBody } from "../../types";

// Makes sure we pass the email and domain claims as Attributes so that we can change them
// - this is the expected behaviour when importing data
const remapAttributes = type => ({ email, domain }, attributes) => {
  if (type === "user" && email !== undefined) return { email, ...attributes };
  if (type === "account" && domain !== undefined)
    return { domain, ...attributes };
  return attributes;
};

export default async function importHandler(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  const { client } = ctx;

  // $FlowFixMe
  const body: ImportBody = message.body || {};
  const { payloads, type } = body;
  const { rows } = payloads;
  if (!payloads) {
    return {
      status: 200,
      data: {
        message: "No rows to import"
      }
    };
  }

  // Don't use customer-provided data directly
  const entityType = type === "user" ? "user" : "account";
  const method = entityType === "account" ? client.asAccount : client.asUser;

  const remap = remapAttributes(entityType);
  rows.map(async ({ claims, attributes }) => {
    const scopedClient = method(claims);
    try {
      await scopedClient.traits(remap(claims, attributes));
    } catch (err) {
      scopedClient.logger.info(`incoming.${entityType}.error`, {
        message: _.get(err, "message")
      });
    }
  });

  return {
    status: 200,
    data: {
      message: "ok",
      ok: true
    }
  };
}
