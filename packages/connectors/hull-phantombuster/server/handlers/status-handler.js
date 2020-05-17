// @flow
import type { HullContext, HullStatusResponse } from "hull";
import updateAgentDetails from "../lib/agent-details";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { id, api_key } = private_settings;

  // if (check.empty(ctx, code)) {
  //   return {
  //     status: "warning",
  //     messages: [
  //       "This connector doesn't contain code. It is recommended for performance reasons to remove empty connectors from your organization."
  //     ]
  //   };
  // }
  //
  // if (check.pristine(ctx, code)) {
  //   return {
  //     status: "setupRequired",
  //     messages: [
  //       'This connector contains the default "hello world" code. If you need help writing code, please refer to the connector documentation.'
  //     ]
  //   };
  // }

  let status = "ok";

  const messages = [];
  if (!id) {
    status = "setupRequired";
    messages.push(
      "No Phantom ID detected. Please configure it in the Settings"
    );
  }
  if (!api_key) {
    status = "setupRequired";
    messages.push("No API Key detected. Please configure it in the settings");
  }

  try {
    const data = await updateAgentDetails(ctx, false);
  } catch (err) {
    status = "error";
    messages.push(err);
  }

  return { messages, status };
}
