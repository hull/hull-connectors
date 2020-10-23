import fetchToken from "./middlewares/fetch-token";

export { default as manifest } from "./manifest";
export { default as incomingHandler } from "./incoming-handler";
export { default as credentialsHandler } from "./credentials-handler";

export const middlewares = [fetchToken];
