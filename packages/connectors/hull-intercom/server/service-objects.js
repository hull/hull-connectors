/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const IntercomCompanyRead: ServiceObjectDefinition = {
  service_name: "intercom_company_read",
  name: "Company"
};

const IntercomUserRead: ServiceObjectDefinition = {
  service_name: "intercom_user_read",
  name: "User"
};

const IntercomLeadRead: ServiceObjectDefinition = {
  service_name: "intercom_lead_read",
  name: "Lead"
};

const IntercomUserWrite: ServiceObjectDefinition = {
  service_name: "intercom_user_write",
  name: "User"
};

const IntercomLeadWrite: ServiceObjectDefinition = {
  service_name: "intercom_lead_write",
  name: "Lead"
};

const IntercomEventWrite: ServiceObjectDefinition = {
  service_name: "intercom_event_write",
  name: "Event"
};

const IntercomAttributeDefinition: ServiceObjectDefinition = {
  service_name: "intercom_attribute_definition",
  name: "IntercomAttributeDefinition"
};

module.exports = {
  IntercomCompanyRead,
  IntercomUserRead,
  IntercomLeadRead,
  IntercomUserWrite,
  IntercomLeadWrite,
  IntercomEventWrite,
  IntercomAttributeDefinition
};
