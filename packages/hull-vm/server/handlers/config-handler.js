// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const confHandler = (
  configResponse: (ctx: HullContext) => Promise<Object>
) => async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { hostname } = message;
  const { clientCredentialsEncryptedToken, connector } = ctx;
  const { private_settings } = connector;
  const { code, language } = private_settings;
  if (hostname && clientCredentialsEncryptedToken) {
    const data: {} = await configResponse(ctx);
    return {
      status: 200,
      data: {
        language: language || "javascript",
        code,
        ...data
      }
    };
  }
  return {
    status: 403
  };
};

export default confHandler;
