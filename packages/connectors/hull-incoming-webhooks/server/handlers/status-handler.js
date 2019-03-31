// @flow
import type { HullContext, HullStatusResponse } from "hull";
import check from "syntax-error";
import _ from "lodash";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector, client } = ctx;
  const messages = [];
  let status = "ok";
  if (!_.get(connector.private_settings, "code")) {
    status = "error";
    messages.push(
      "No code is stored. Start by sending a webhook and writing some code"
    );
  }

  const err = check(connector.private_settings.code);
  if (err) {
    status = "error";
    messages.push("Your code seems to have errors.");
  }

  client.put(`${connector.id}/status`, { status, messages });
  return { messages, status };
}
