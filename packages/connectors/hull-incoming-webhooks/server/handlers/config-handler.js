// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import type { ConfResponse } from "../../types";

const confHandler = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { clientCredentialsEncryptedToken, connector } = ctx;
  const { private_settings = {} } = connector;
  const { code } = private_settings;
  const { hostname } = message;
  if (hostname && clientCredentialsEncryptedToken) {
    const data: ConfResponse = {
      current: {
        connectorId: connector.id,
        code
      },
      hostname,
      token: clientCredentialsEncryptedToken
    };
    return {
      status: 200,
      data
    };
  }
  return {
    status: 403
  };
};

export default confHandler;
