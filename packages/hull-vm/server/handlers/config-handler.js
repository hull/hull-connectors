// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import type { ConfResponse } from "hull-vm";

const confHandler = (
  configResponse: (ctx: HullContext) => Promise<Object>
) => async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { hostname } = message;
  const { clientCredentialsEncryptedToken } = ctx;
  if (hostname && clientCredentialsEncryptedToken) {
    const data: ConfResponse = await configResponse(ctx);
    return {
      status: 200,
      data: {
        current: {
          connectorId: ctx.connector.id,
          code: ctx.connector.private_settings.code
        },
        ...data
      }
    };
  }
  return {
    status: 403
  };
};

export default confHandler;
