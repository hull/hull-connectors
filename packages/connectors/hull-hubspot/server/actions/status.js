/* @flow */
import type { HullContext, HullStatusResponse } from "hull";
import getCachedClientCredentials from "./get-cached-client-credentials";

const _ = require("lodash");

const SyncAgent = require("../lib/sync-agent");

function getMessageFromError(err): string {
  if (
    err.message &&
    typeof err.message === "string" &&
    err.message.indexOf("Failed to refresh access token") === 0
  ) {
    return 'Authorization issue. Please reauthenticate with Hubspot by clicking the "Credentials and Actions" button in the upper right hand section of the connector settings.  Then either click "Continue to Hubspot" or "Start over"';
  }

  // return either the msg or message parameter from err
  return `Could not get response from Hubspot due to error ${_.get(
    err,
    "msg",
    _.get(err, "message", "")
  )}`;
}

const statusHierarchy = ["ok", "warning", "error", "setupRequired"];
// -1 is (status1 < status2)
// 0 is (status1 === status2)
// 1 is (status1 > status1)
function compareStatus(status1: string, status2: string) {
  if (status1 === status2) return 0;

  if (statusHierarchy.indexOf(status1) < statusHierarchy.indexOf(status2)) {
    return -1;
  }

  return 1;
}

async function statusCheckAction(ctx: HullContext): HullStatusResponse {
  const { connector = {} } = ctx;
  const messages = [];

  const pushMessage = (
    status: "error" | "warning" | "ok" | "setupRequired",
    message: string
  ) => {
    // make sure the message isn't already in the list...

    const existingMessage = _.find(messages, { message });
    if (!existingMessage) {
      messages.push({ status, message });
    }
  };

  if (!_.get(connector, "private_settings.token")) {
    pushMessage(
      "setupRequired",
      'Connector has not been authenticated. Please make sure to allow Hull to access your Hubspot data by going to the "Settings" tab and clicking "Login to your Hubspot account" in the "Connect to Hubspot" section'
    );
  }

  // This doesn't really matter either.
  // If there's a real problem, we'll hit Unauthorized when doing the below tests
  if (
    _.get(connector, "private_settings.token") &&
    !_.get(connector, "private_settings.refresh_token")
  ) {
    pushMessage(
      "setupRequired",
      'Error in authenticating with Hubspot.  Hubspot service did not return the proper OAuth Credentials.  Please reauthenticate with Hubspot by clicking "Credentials & Actions" and then click "Start Over".  If it happens again, please contact Hull Support.'
    );
  }

  const portalId = _.get(connector, "private_settings.portal_id", null);
  const fetchDeleted =
    _.get(connector, "private_settings.mark_deleted_contacts", false) ||
    _.get(connector, "private_settings.mark_deleted_companies", false);
  if (
    portalId !== null &&
    fetchDeleted &&
    _.isEmpty(await getCachedClientCredentials(ctx, portalId))
  ) {
    pushMessage("ok", "Credentials Are Not Cached. Please Re-authenticate.");
  }

  if (
    _.isEmpty(
      _.get(connector, "private_settings.synchronized_user_segments", [])
    )
  ) {
    pushMessage(
      "ok",
      "No users will be sent from Hull to Hubspot because there are no whitelisted segments configured. If you want to enable outgoing user traffic, please visit the connector settings page and add user segments to be sent to Hubspot, otherwise please ignore this notification."
    );
  }

  // Separating these two checks for clearer user guidance
  // during connector setup
  if (
    _.isEmpty(
      _.get(connector, "private_settings.synchronized_account_segments", [])
    )
  ) {
    pushMessage(
      "ok",
      "No accounts will be sent from Hull to Hubspot because there are no whitelisted segments configured. If you want to enable outgoing account traffic, please visit the connector settings page and add account segments to be sent to Hubspot, otherwise please ignore this notification."
    );
  }

  const syncAgent = new SyncAgent(ctx);
  const promises = [];
  if (_.get(connector, "private_settings.token")) {
    promises.push(
      syncAgent.hubspotClient
        .getContactPropertyGroups()
        .then(body => {
          if (!_.find(body, g => g.name === "hull")) {
            pushMessage(
              "warning",
              "Hubspot is missing the Hull custom attribute group.  This may be problematic if you wish to create new fields in Hubspot for storing new Hull that don't exist in Hubspot. Initial synch with Hubspot may not have been completed yet.  If this warning persists please contact your Hull support representative."
            );
          } else if (
            !_.find(body.filter(g => g.name === "hull"), g =>
              _.includes(g.properties.map(p => p.name), "hull_segments")
            )
          ) {
            pushMessage(
              "warning",
              "Hubspot is missing the hull_segments custom attribute. Initial sync with Hubspot may not have been completed yet. If this warning persists please contact your Hull Support."
            );
          }
        })
        .catch(err => {
          pushMessage("error", getMessageFromError(err));
        })
    );
  }

  await Promise.all(promises);
  let worstStatus = "ok";
  let messagesToSend = [];
  _.forEach(messages, message => {
    const statusComparison = compareStatus(worstStatus, message.status);
    if (statusComparison === 0) {
      messagesToSend.push(message.message);
    } else if (statusComparison < 0) {
      messagesToSend = [message.message];
      worstStatus = message.status;
    }
  });

  const statusResults = { status: worstStatus, messages: messagesToSend };
  return statusResults;
}

module.exports = statusCheckAction;
