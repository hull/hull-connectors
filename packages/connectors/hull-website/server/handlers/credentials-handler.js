// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullCredentialsResponse
} from "hull";

const HULL_JS_URL = "https://js.hull.io/0.10.0/hull.js.gz";

const credentialsHandler = REMOTE_DOMAIN => (
  ctx: HullContext
): HullCredentialsResponse => {
  const { clientCredentials } = ctx;
  const { id, organization } = clientCredentials;
  const namespace = organization.split(",")[0];
  return {
    status: 200,
    data: {
      url: `<script async id='hull-js-sdk' app-id='${id}' org-url='https://${namespace}.${REMOTE_DOMAIN}' src='${HULL_JS_URL}'></script>`
    }
  };
};

export default credentialsHandler;
