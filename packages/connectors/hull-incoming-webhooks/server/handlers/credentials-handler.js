// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const credentialsHandler = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { clientCredentialsEncryptedToken, connector } = ctx;
  const { hostname } = message;
  if (hostname && clientCredentialsEncryptedToken) {
    return {
      status: 200,
      data: {
        url: `https://${hostname}/webhooks/${connector.id}/${clientCredentialsEncryptedToken}`
      }
    };
  }
  return {
    status: 403
  };
};

export default credentialsHandler;
