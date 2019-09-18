/* @flow */
import type { $Response } from "express";
import type { TRequest } from "hull";

const _ = require("lodash");

function statusCheckAction(req: TRequest, res: $Response): void {
  if (!_.has(req, "hull.ship.private_settings")) {
    res.status(404).json({ status: 404, messages: ["Connector not found"] });
    return;
  }
  const {
    ship,
    client
  } = req.hull;
  const messages: Array<string> = [];
  let status: string = "ok";

  if (_.get(ship, "private_settings.enabled", false) === false) {
    status = "warning";
    messages.push("Connector is not enabled, no accounts will be sent to Madkudu. Go to Settings to enable the connector.");
  }

  if (!_.get(ship, "private_settings.api_key", null)) {
    status = "error";
    messages.push("Missing Credentials: API key is not configured in Settings.");
  }

  res.json({ status, messages });
  client.logger.debug("ship.status", { status, messages });
  client.put(`${ship.id}/status`, { status, messages });
}

module.exports = statusCheckAction;
