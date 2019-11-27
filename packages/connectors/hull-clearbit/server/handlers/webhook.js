// @flow
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import { saveAccount, saveUser } from "../lib/side-effects";

export default async function handleWebhook(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  const { query, body: requestBody } = message;
  // $FlowFixMe
  const { id, status, type, body } = requestBody;
  const { client, metric } = ctx;
  client.logger.debug("clearbit.webhook.payload", {
    query,
    body: requestBody
  });
  metric.increment("ship.clearbit.incoming_webhook", 1);

  if (
    id &&
    (type === "company" || type === "person" || type === "person_company") &&
    status === 200
  ) {
    const [user_id, account_id] = id.split(":");
    let person;
    let company;

    if (type === "person") {
      person = body;
    } else if (type === "person_company") {
      person = body.person;
      company = body.company;
    } else if (type === "company") {
      company = body;
    }

    const promises = [];

    if (person) {
      promises.push(
        // $FlowFixMe
        saveUser(ctx, { user: { id: user_id }, person, source: "enrich" })
      );
    }
    if (company) {
      promises.push(
        // $FlowFixMe
        saveAccount(ctx, {
          account: { id: account_id },
          person,
          company,
          user: { id: user_id },
          source: "enrich"
        })
      );
    }
    await Promise.all(promises);

    return {
      status: 200,
      data: {
        message: "thanks"
      }
    };
  }
  ctx.client.logger.error("incoming.user.error", {
    message: "invalid webhook",
    requestBody
  });
  return {
    status: 200,
    data: {
      message: "ignored"
    }
  };
}
