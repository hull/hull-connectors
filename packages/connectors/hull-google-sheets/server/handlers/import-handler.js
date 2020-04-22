// @flow
import _ from "lodash";
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import type { ImportBody } from "../../types";

export default async function importHandler(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  const { client } = ctx;

  // $FlowFixMe
  const body: ImportBody = message.body || {};
  const { rows, type = "user" } = body;

  if (!rows) {
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

  rows.forEach(async ({ ident, traits }) => {
    const scopedClient = method(ident);
    try {
      await scopedClient.traits(traits);
      // scopedClient.logger.info(`incoming.${entityType}.success`, { traits });
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
