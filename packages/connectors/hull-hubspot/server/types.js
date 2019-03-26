// @flow
import type { HullUserUpdateMessage, HullAccountUpdateMessage } from "hull";

export type HubspotError = {
  index: number,
  propertyValidationResult: {
    isValid: boolean,
    message: string,
    error: string,
    name: string
  }
};

export type HubspotWriteContactProperties = Array<{
  property: string,
  value: mixed
}>;

export type HubspotWriteContact = {
  vid?: string,
  email?: string,
  properties: HubspotWriteContactProperties
};

export type HubspotWriteCompanyProperties = Array<{
  name: string,
  value: mixed
}>;

export type HubspotWriteCompany = {
  objectId?: string,
  email?: string,
  properties: HubspotWriteCompanyProperties
};

export type HubspotReadContact = {
  addedAt: number,
  "canonical-vid": string,
  vid: string,
  "merged-vids": Array<string>,
  "is-contact": boolean,
  "identity-profiles": Array<{
    vid: string,
    "saved-at-timestamp": number,
    identities: Array<{
      type: string,
      value: string,
      timestamp: number,
      "is-primary": boolean
    }>
  }>,
  properties: {
    [propertyName: string]: {
      value: mixed
    },
    associatedcompanyid: {
      value: string
    },
    lastmodifieddate: {
      value: string
    }
  }
};

export type HubspotReadCompany = {
  companyId: string,
  isDeleted: boolean,
  portalId: string,
  properties: {
    [propertyName: string]: {
      value: mixed
    },
    lastmodifieddate: {
      value: string
    }
  }
};

export type HubspotUserUpdateMessageEnvelope = {
  message: HullUserUpdateMessage,
  hubspotWriteContact: HubspotWriteContact,
  skipReason?: string,
  error?: string,
  errorProperty?: string,
  hull_summary?: string
};

export type HubspotAccountUpdateMessageEnvelope = {
  message: HullAccountUpdateMessage,
  hubspotWriteCompany: HubspotWriteCompany,
  hubspotReadCompany?: HubspotReadCompany, // when we do insert we get back the HubspotReadCompany as a response
  skipReason?: string,
  error?: string,
  errorProperty?: string,
  hull_summary?: string
};

export type FilterUtilResults<T> = {
  toInsert: Array<T>,
  toUpdate: Array<T>,
  toSkip: Array<T>
};

export type HubspotContactProperty = {
  name: string,
  label: string,
  description?: string,
  groupName: string,
  type: string,
  fieldType: string,
  options: Array<any>,
  hidden: boolean,
  createdAt: null | any,
  updatedAt: null | any,
  searchableInGlobalSearch: boolean,
  hubspotDefined: boolean,
  calculated: boolean,
  externalOptions: boolean,
  deleted: null | any,
  formField: boolean,
  displayOrder: number,
  readOnlyValue: boolean,
  readOnlyDefinition: boolean,
  mutableDefinitionNotDeletable: boolean,
  favorited: boolean,
  favoritedOrder: number,
  displayMode: string,
  showCurrencySymbol: null | any,
  createdUserId: null | any,
  textDisplayHint: null | any,
  numberDisplayHint: null | any,
  optionsAreMutable: null | any,
  referencedObjectType: null | any,
  isCustomizedDefault: boolean,
  updatedUserId: null | any
};

export type HubspotCompanyProperty = HubspotContactProperty;

export type HubspotContactPropertyWrite = {
  name: string,
  label: string,
  description?: string,
  displayOrder: any,
  calculated?: boolean,
  groupName: string,
  formField: boolean,
  type: string,
  fieldType: string,
  options?: Array<any>
};

export type HubspotContactPropertyGroup = {
  name: string,
  displayName: string,
  displayOrder: number,
  hubspotDefined: boolean,
  properties: Array<HubspotContactProperty>
};

export type HubspotContactPropertyGroups = Array<HubspotContactPropertyGroup>;

export type HubspotCompanyPropertyGroup = {
  name: string,
  displayName: string,
  displayOrder: number,
  hubspotDefined: boolean,
  properties: Array<HubspotCompanyProperty>
};

export type HubspotCompanyPropertyWrite = HubspotContactPropertyWrite;
export type HubspotCompanyPropertyGroups = Array<HubspotCompanyPropertyGroup>;

export type HullProperty = {
  id: string,
  text: string,
  type: string,
  id_path: Array<string>,
  path: Array<string>,
  title: string,
  key: string
};

export type HubspotDefaultContactMapping = {
  name: string,
  hull: string,
  type: string,
  title: string,
  read_only: boolean
};

export type HubspotContactAttributesIncomingSetting = {
  name: string,
  hull: string,
  service: string
};

export type HubspotContactAttributesOutgoingSetting = {
  hull: string,
  name: string,
  service: string
};

export type HubspotContactOutgoingMapping = {
  hull_trait_name: $PropertyType<
    HubspotContactAttributesOutgoingSetting,
    "hull"
  >,
  hull_default_trait_name: $PropertyType<
    HubspotDefaultContactMapping,
    "hull"
  > | null,
  hull_trait_type: $PropertyType<HullProperty, "type">,
  hubspot_property_name: $PropertyType<
    HubspotContactAttributesOutgoingSetting,
    "name"
  >,
  hubspot_property_label?: $PropertyType<HubspotContactProperty, "label">,
  hubspot_property_read_only?: $PropertyType<
    HubspotContactProperty,
    "readOnlyValue"
  >,
  hubspot_property_type?: $PropertyType<HubspotContactProperty, "type">,
  hubspot_property_field_type?: $PropertyType<
    HubspotContactProperty,
    "fieldType"
  >,
  hubspot_property_display_order?: $PropertyType<
    HubspotContactProperty,
    "displayOrder"
  >
};

export type HubspotContactIncomingMapping = {
  hull_trait_name: $PropertyType<
    HubspotContactAttributesOutgoingSetting,
    "hull"
  >,
  hull_trait_type?: $PropertyType<HullProperty, "type">,
  hubspot_property_name: $PropertyType<
    HubspotContactAttributesOutgoingSetting,
    "name"
  >,
  hubspot_property_read_only: $PropertyType<
    HubspotContactProperty,
    "readOnlyValue"
  >,
  hubspot_property_type: $PropertyType<HubspotContactProperty, "type">,
  hubspot_property_field_type: $PropertyType<
    HubspotContactProperty,
    "fieldType"
  >
};

export type HubspotDefaultCompanyMapping = {
  hubspot: string,
  hull: string,
  type: string,
  title: string,
  read_only: boolean
};

export type HubspotCompanyAttributesIncomingSetting = {
  hubspot: string,
  service: string,
  hull: string
};

export type HubspotCompanyAttributesOutgoingSetting = {
  hull: string,
  service: string,
  hubspot: string
};

export type HubspotCompanyOutgoingMapping = HubspotContactOutgoingMapping;
export type HubspotCompanyIncomingMapping = HubspotContactIncomingMapping;
