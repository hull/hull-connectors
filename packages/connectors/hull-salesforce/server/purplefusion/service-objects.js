/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const SalesforceTaskRead: ServiceObjectDefinition = {
  service_name: "salesforce_incoming_task",
  name: "Task"
};

const SalesforceTaskWrite: ServiceObjectDefinition = {
  service_name: "salesforce_outgoing_task",
  name: "Task"
};

const SalesforceContactRead: ServiceObjectDefinition = {
  service_name: "salesforce_contact_read",
  name: "Contact"
};

const SalesforceContactWrite: ServiceObjectDefinition = {
  service_name: "salesforce_contact_write",
  name: "Contact"
};

const SalesforceLeadRead: ServiceObjectDefinition = {
  service_name: "salesforce_lead_read",
  name: "Lead"
};

const SalesforceLeadWrite: ServiceObjectDefinition = {
  service_name: "salesforce_lead_write",
  name: "Lead"
};

const SalesforceAccountRead: ServiceObjectDefinition = {
  service_name: "salesforce_account_read",
  name: "Account"
};

const SalesforceAccountWrite: ServiceObjectDefinition = {
  service_name: "salesforce_account_write",
  name: "Account"
};

module.exports = {
  SalesforceTaskRead,
  SalesforceTaskWrite,
  SalesforceContactWrite,
  SalesforceContactRead,
  SalesforceLeadRead,
  SalesforceLeadWrite,
  SalesforceAccountWrite,
  SalesforceAccountRead
};
