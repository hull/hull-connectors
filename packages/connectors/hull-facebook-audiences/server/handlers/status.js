/* @flow */

import _ from "lodash";
import type { HullContext } from "hull";

const FacebookAudience = require("../lib/facebook-audience");

const STATUS_TYPE = {
  OK: "ok",
  ERROR: "error"
};

function determineStatus(currentStatus, newStatus) {
  if (currentStatus !== STATUS_TYPE.ERROR) {
    return _.find(STATUS_TYPE, s => {
      return s === newStatus;
    });
  }
  return currentStatus;
}

function statusHandler(ctx: HullContext) {
  const { connector, client, helpers, segments, metric } = ctx;
  const messages = [];

  let status = STATUS_TYPE.OK;

  const handler = new FacebookAudience(
    connector,
    client,
    helpers,
    segments,
    metric
  );

  const synchronizedSegments = connector.private_settings.synchronized_segments; // default = []
  const synchronizedSegmentsMapping =
    connector.private_settings.synchronized_segments_mapping; // default = undefined

  if (!handler.isConfigured()) {
    status = determineStatus(status, STATUS_TYPE.ERROR);
    messages.push("Connector is not authorized with Facebook API");
  }

  if (
    synchronizedSegments &&
    synchronizedSegments.length > 0 &&
    !synchronizedSegmentsMapping
  ) {
    status = determineStatus(status, STATUS_TYPE.ERROR);
    messages.push(
      "Due to recent Facebook API changes, you need to migrate segments information adding `customer_file_source` information. Until you add them, this connector won't be able to create new custom audiences."
    );
  }

  if (
    synchronizedSegmentsMapping === undefined ||
    synchronizedSegmentsMapping.length === 0
  ) {
    status = determineStatus(status, STATUS_TYPE.OK);
    messages.push(
      "Nothing will be sent to Facebook because there are not segments whitelisted. Please visit the connector settings page and add user segments which will create Custom Audiences"
    );
  }

  handler
    .fetchAudiences(1, false)
    .then(() => {
      // correct response
    })
    .catch(error => {
      status = determineStatus(status, STATUS_TYPE.ERROR);
      messages.push(error.message);
    })
    .then(() => {
      // client.put(`${connector.id}/status`, { status, messages });
      return { messages, status };
    });
}

module.exports = statusHandler;
