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
      url: `<script src="https://${hostname}/ship.js" type="text/javascript" async defer data-hull-id="${id}" data-hull-endpoint="https://${hostname}" charset="utf-8"></script>`
    }
  };
};

export default credentialsHandler;
