// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import { asyncComputeAndIngest, varsFromSettings, serialize } from "hull-vm";

export default async function handler(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { client, connector } = ctx;
  const { private_settings = {} } = connector;
  // const { code } = private_settings;

  // $FlowFixMe
  const { preview, code } = message.body;

  try {
    const result = await asyncComputeAndIngest(ctx, {
      source: "repl",
      payload: {
        variables: varsFromSettings(ctx)
      },
      code,
      preview
    });
    return {
      status: 200,
      data: {
        code,
        result: {
          ...serialize(result),
          logs: [...result.logs, ["Call successful"]]
        }
      }
    };
  } catch (err) {
    client.logger.error("connector.request.error", {
      ...private_settings,
      error: err
    });
    return {
      status: 500,
      data: {
        error: err
      }
    };
  }
}
