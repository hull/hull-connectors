// @flow
import type { HullContext, HullStatusResponse } from "hull";
import updateAgentDetails from "../lib/agent-details";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { agent_id, api_key } = private_settings;

  let status = "ok";

  const messages = [];

  try {
    if (!api_key) {
      status = "setupRequired";
      messages.push("No API Key detected. Please configure it in the settings");
    } else if (!agent_id) {
      status = "warning";
      messages.push(
        "No Phantom ID detected. Please configure it in the Settings"
      );
    } else {
      await updateAgentDetails(ctx, false);
    }
  } catch (err) {
    status = "error";
    messages.push(err);
  }

  return { messages, status };
}
