/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const FreshsuccessAccountRead: ServiceObjectDefinition = {
  service_name: "freshsuccess_account_read",
  name: "Account"
};

const FreshsuccessAccountWrite: ServiceObjectDefinition = {
  service_name: "freshsuccess_account_write",
  name: "Account"
};

const FreshsuccessContactRead: ServiceObjectDefinition = {
  service_name: "freshsuccess_contact_read",
  name: "Contact"
};

const FreshsuccessContactWrite: ServiceObjectDefinition = {
  service_name: "freshsuccess_contact_write",
  name: "Contact"
};

const FreshsuccessIncomingAttributeDefinition: ServiceObjectDefinition = {
  service_name: "freshsuccess_incoming_attribute_definition",
  name: "FreshsuccessIncomingAttributeDefinition"
};

const FreshsuccessOutgoingAttributeDefinition: ServiceObjectDefinition = {
  service_name: "freshsuccess_outgoing_attribute_definition",
  name: "FreshsuccessOutgoingAttributeDefinition"
};

// arrays
const FreshsuccessAccountReads: ServiceObjectDefinition = {
  service_name: "freshsuccess_account_reads",
  name: "Accounts"
};

const FreshsuccessAccountWrites: ServiceObjectDefinition = {
  service_name: "freshsuccess_account_writes",
  name: "Accounts"
};

const FreshsuccessContactReads: ServiceObjectDefinition = {
  service_name: "freshsuccess_contact_reads",
  name: "Contacts"
};

const FreshsuccessContactWrites: ServiceObjectDefinition = {
  service_name: "freshsuccess_contact_writes",
  name: "Contacts"
};

module.exports = {
  FreshsuccessAccountReads,
  FreshsuccessAccountWrites,
  FreshsuccessContactReads,
  FreshsuccessContactWrites,
  FreshsuccessAccountRead,
  FreshsuccessAccountWrite,
  FreshsuccessContactRead,
  FreshsuccessContactWrite,
  FreshsuccessIncomingAttributeDefinition,
  FreshsuccessOutgoingAttributeDefinition
};
