// @flow
import { HullContext, HullIncomingHandlerMessage } from "hull";

import Clearbit from "../clearbit";

export default function handleWebhook(
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

  if ((type === "person" || type === "person_company") && status === 200) {
    let person;

    if (type === "person") {
      person = body;
    } else if (type === "person_company") {
      person = { ...body.person, company: body.company };
    }

    if (person) {
      client
        .asUser({ id })
        .logger.info("incoming.user.start", { source: "webhook" });
      new Clearbit(ctx).saveUser(
        { user: { id }, person },
        {
          source: "enrich",
          incoming: true
        }
      );
    }

    return {
      status: 200,
      data: {
        message: "thanks"
      }
    };
  }
  return {
    status: 200,
    data: {
      message: "ignored"
    }
  };
}
