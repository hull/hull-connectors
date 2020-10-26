import fetchToken from "./middlewares/fetch-token";
import incomingHandler from "./incoming-handler";
import credentialsHandler from "./credentials-handler";

export { default as manifest } from "./manifest";
export const middlewares = [fetchToken];
export const getHandlers = handler => ({
  json: {
    credentialsHandler
  },
  incoming: {
    incomingHandler: incomingHandler(handler)
  }
});
