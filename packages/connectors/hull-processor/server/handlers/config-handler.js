// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
// import type { ConfResponse } from "hull-vm";

const confHandler = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { clientCredentialsEncryptedToken, connector } = ctx;
  const { private_settings = {} } = connector;
  const { code } = private_settings;
  const { hostname } = message;
  try {
    const eventSchema = await ctx.entities.events.getSchema();
    if (hostname && clientCredentialsEncryptedToken) {
      return {
        status: 200,
        data: {
          eventSchema,
          current: {
            connectorId: connector.id,
            code
          }
        }
      };
    }
    return {
      status: 403
    };
  } catch (err) {
    return {
      status: 500,
      error: err.message
    };
  }
};

export default confHandler;
