// @flow
import type { HullContext, HullStatusResponse } from "hull";

const _ = require("lodash");

async function statusCheckAction(ctx: HullContext): HullStatusResponse {
  const { connector = {} } = ctx;
  const { private_settings } = connector;
  const {
    instance_url,
    access_token,
    refresh_token,
    login_url,
    salesforce_login,
    salesforce_password,
    lead_attributes_outbound,
    lead_attributes_inbound,
    contact_attributes_inbound,
    contact_attributes_outbound
  } = private_settings;

  const messages = [];
  let status = "ok";

  if (instance_url && !access_token) {
    status = "setupRequired";
    messages.push(
      "External service credentials aren’t set: missing API access token."
    );
  }

  if (instance_url && !refresh_token) {
    status = "setupRequired";
    messages.push(
      "External service credentials aren’t set: missing API refresh token."
    );
  }

  const attributeMapping = _.pick(private_settings, [
    "lead_attributes_outbound",
    "lead_attributes_inbound",
    "contact_attributes_inbound",
    "contact_attributes_outbound",
    "account_attributes_outbound",
    "account_attributes_inbound"
  ]);

  _.forEach(attributeMapping, (mapping, mappingType) => {
    const emptyMappings = _.filter(mapping, entry => {
      return _.isEmpty(entry.service) || _.isEmpty(entry.hull);
    });
    if (!_.isEmpty(emptyMappings)) {
      status = "error";
      messages.push(
        `Invalid ${_.startCase(
          mappingType
        )} attribute mapping: ${JSON.stringify(emptyMappings)}. `
      );
    }
  });

  if (_.isEmpty(lead_attributes_outbound, [])) {
    if (status !== "error") {
      status = "ok";
    }
    messages.push(
      "No leads will be sent from Hull to Salesforce due to missing configuration"
    );
  }

  if (_.isEmpty(lead_attributes_inbound, [])) {
    if (status !== "error") {
      status = "ok";
    }
    messages.push(
      "No lead fields will be fetched from Salesforce due to missing configuration"
    );
  }

  if (_.isEmpty(contact_attributes_inbound, [])) {
    if (status !== "error") {
      status = "ok";
    }
    messages.push(
      "No contacts fields will be fetched from Salesforce due to missing configuration"
    );
  }

  if (_.isEmpty(contact_attributes_outbound, [])) {
    if (status !== "error") {
      status = "ok";
    }
    messages.push(
      "No contacts will be sent from Hull to Salesforce due to missing configuration"
    );
  }

  if (login_url && (!salesforce_login || !salesforce_password)) {
    status = "setupRequired";
    messages.push(
      "External service credentials aren’t set: missing API login and password"
    );
  }

  return { status, messages };
}

module.exports = statusCheckAction;
