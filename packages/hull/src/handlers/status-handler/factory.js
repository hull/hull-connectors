// @flow
import type {
  HullRouteMap,
  HullRequest,
  HullResponse,
  HullStatusHandlerConfigurationEntry,
  HullStatusResponse
} from "../../types";
import getRouter from "../get-router";
import errorHandler from "../error-handler";
import getMessage from "../../utils/get-message-from-request";

function statusHandlerFactory(
  configurationEntry: HullStatusHandlerConfigurationEntry
): HullRouteMap {
  const { method, options = {}, callback } = configurationEntry;

  async function handler(req: HullRequest, res: HullResponse) {
    try {
      const message = getMessage(req);
      const response: HullStatusResponse = await callback(req.hull, message);
      await req.hull.client.put(`${req.hull.connector.id}/status`, response);
      res.json(response);
    } catch (err) {
      res.status(500).json({
        status: "error"
      });
    }
  }
  return getRouter({
    method,
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      respondWithError: false,
      strict: false,
      ...options
    },
    requestName: "status",
    errorHandler,
    handler
  });
}

module.exports = statusHandlerFactory;
