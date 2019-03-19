// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import type { ConfResponse } from "../../types";
import { encrypt } from "../lib/crypto";

const confHandler = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { clientCredentials, connectorConfig } = ctx;
  const { hostSecret } = connectorConfig;
  const { hostname } = message;
  if (hostname && clientCredentials) {
    const data: ConfResponse = {
      hostname,
      token: encrypt(clientCredentials, hostSecret)
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
