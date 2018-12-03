/* @flow */
import type { HullContext } from "hull";

const _ = require("lodash");

const SyncAgent = require("../lib/sync-agent");

function statusCheckAction(ctx: HullContext) {
  const { connector = {}, client = {} } = ctx;
  const messages = [];
  let status = "ok";
  const pushMessage = message => {
    status = "error";
    messages.push(message);
  };
  const promises = [];

  if (!_.get(connector, "private_settings.token")) {
    pushMessage("Missing API token.");
  }

  if (!_.get(connector, "private_settings.refresh_token")) {
    pushMessage("Missing refresh token.");
  }

  if (!_.get(connector, "private_settings.portal_id")) {
    pushMessage("Missing portal id.");
  }

  if (
    _.isEmpty(_.get(connector, "private_settings.sync_fields_to_hubspot", []))
  ) {
    pushMessage(
      "No fields are going to be sent from hull to hubspot because of missing configuration."
    );
  }

  if (_.isEmpty(_.get(connector, "private_settings.sync_fields_to_hull", []))) {
    pushMessage(
      "No fields are going to be sent from hubspot to hull because of missing configuration."
    );
  }

  const syncAgent = new SyncAgent(ctx);
  if (_.get(connector, "private_settings.token")) {
    promises.push(
      syncAgent.hubspotClient
        .getRecentlyUpdatedContacts()
        .then(results => {
          if (results.body.contacts && results.body.contacts.length === 0) {
            pushMessage("Got Zero results when fetching contacts.");
          }
        })
        .catch(err => {
          pushMessage(
            `Could not get response from Hubspot due to error ${_.get(
              err,
              "msg",
              _.get(err, "message", "")
            )}`
          );
        })
    );
    promises.push(
      syncAgent.hubspotClient
        .getContactPropertyGroups()
        .then(body => {
          if (!_.find(body, g => g.name === "hull")) {
            pushMessage(
              "Hubspot is not properly configured. Missing hull group"
            );
          } else if (!_.find(body, g => g.displayName === "Hull Properties")) {
            pushMessage(
              "Hubspot is not properly configured. Missing hull group name"
            );
          } else if (
            !_.find(body.filter(g => g.name === "hull"), g =>
              _.includes(g.properties.map(p => p.name), "hull_segments")
            )
          ) {
            pushMessage(
              "Hubspot is not properly configured. Missing hull segments as hull group property"
            );
          }
        })
        .catch(err => {
          pushMessage(
            `Could not get response from Hubspot due to error ${_.get(
              err,
              "msg",
              _.get(err, "message", "")
            )}`
          );
        })
    );
  }

  return Promise.all(promises)
    .then(() => {
      return client.put(`${connector.id}/status`, { status, messages });
    })
    .then(() => {
      return { status, messages };
    });
}

module.exports = statusCheckAction;
