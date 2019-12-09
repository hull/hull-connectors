// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullCredentialsResponse
} from "hull";

const credentialsHandler = (
  ctx: HullContext,
  _message: HullIncomingHandlerMessage
): HullCredentialsResponse => {
  const { hostname, clientCredentials } = ctx;
  const { id } = clientCredentials;
  return {
    status: 200,
    data: {
      url: `https://${hostname}/ship.js#${id}`
    }
  };
};

export default credentialsHandler;
