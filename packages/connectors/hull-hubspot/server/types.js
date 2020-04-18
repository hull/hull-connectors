// @flow
import type { HullUserUpdateMessage, HullAccountUpdateMessage } from "hull";

export type ServiceType = "contact" | "company";
export type HullType = "user" | "account";

export type HubspotSchema = Array<{
  property: string,
  type: string,
  field_type: string,
  read_only: boolean,
  formatter: any
}>;

export type HubspotWriteContactProperty = {
  property: string,
  value: mixed
};

export type HubspotWriteContact = {
  vid?: string,
  email?: string,
  properties: Array<HubspotWriteContactProperty>
};

export type HubspotWriteCompanyProperty = {
  name: string,
  value: mixed
};

export type HubspotWriteCompany = {
  objectId?: string,
  email?: string,
  properties: Array<HubspotWriteCompanyProperty>
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

export type HubspotProperty = {
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

export type HubspotPropertyWrite = {
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

export type HubspotPropertyGroup = {
  name: string,
  displayName: string,
  displayOrder: number,
  hubspotDefined: boolean,
  properties: Array<HubspotProperty>
};

export type HullProperty = {
  id: string,
  text: string,
  type: string,
  id_path: Array<string>,
  path: Array<string>,
  title: string,
  key: string
};
