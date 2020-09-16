// @flow
import type {
  HullAccountAttributes,
  HullUserAttributes,
  HullConnector,
  HullAccountSegment,
  HullUserSegment,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullIncomingClaimsSetting,
  HullContext,
  HullAttributeMapping
} from "hull";

import type {
  HubspotWriteContact,
  HubspotWriteContactProperty,
  HubspotWriteCompany,
  HubspotWriteCompanyProperty,
  HubspotReadContact,
  HubspotReadCompany,
  ServiceType,
  HullType,
  HubspotSchema,
  HubspotPropertyGroup
} from "../../types";

const _ = require("lodash");
const moment = require("moment");
const slug = require("slug");

const attributeFormatter = value => {
  if (Array.isArray(value)) {
    value = value.join(";");
  } else if (_.isPlainObject(value)) {
    value = JSON.stringify(value);
  }

  return value;
};

class MappingUtil {
  ctx: HullContext;

  connector: HullConnector;

  hullClient: Object;

  logger: Object;

  usersSegments: Array<HullUserSegment>;

  accountsSegments: Array<HullAccountSegment>;

  outgoingLinking: boolean;

  contactOutgoingMapping: Array<HullAttributeMapping>;

  contactIncomingMapping: Array<HullAttributeMapping>;

  companyOutgoingMapping: Array<HullAttributeMapping>;

  companyIncomingMapping: Array<HullAttributeMapping>;

  incomingUserClaims: Array<HullIncomingClaimsSetting>;

  incomingAccountClaims: Array<HullIncomingClaimsSetting>;

  outgoingContactSchema: HubspotSchema;

  outgoingCompanySchema: HubspotSchema;

  incomingCompanySchema: HubspotSchema;

  incomingContactSchema: HubspotSchema;

  constructor({
    ctx,
    connector,
    hullClient,
    usersSegments,
    accountsSegments,
    hubspotContactProperties,
    hubspotCompanyProperties
  }: Object) {
    this.ctx = ctx;
    this.connector = connector;
    this.hullClient = hullClient;
    this.logger = hullClient.logger;
    this.usersSegments = usersSegments;
    this.accountsSegments = accountsSegments;

    const {
      incoming_user_attributes = [],
      outgoing_user_attributes = [],
      incoming_account_attributes = [],
      outgoing_account_attributes = [],
      link_users_in_service,
      incoming_user_claims = [],
      incoming_account_claims = []
    } = this.connector.private_settings;

    this.outgoingLinking = link_users_in_service || false;
    this.incomingUserClaims = incoming_user_claims;

    this.outgoingContactSchema = this.getOutgoingServiceSchema(
      hubspotContactProperties,
      outgoing_user_attributes
    );

    this.outgoingCompanySchema = this.getOutgoingServiceSchema(
      hubspotCompanyProperties,
      outgoing_account_attributes
    );

    this.incomingCompanySchema = this.getIncomingServiceSchema(
      hubspotCompanyProperties,
      incoming_account_attributes
    );

    this.incomingConctactSchema = this.getIncomingServiceSchema(
      hubspotContactProperties,
      incoming_user_attributes
    );

    this.incomingAccountClaims = incoming_account_claims;
    this.contactOutgoingMapping = outgoing_user_attributes;
    this.contactIncomingMapping = incoming_user_attributes;
    this.companyOutgoingMapping = outgoing_account_attributes;
    this.companyIncomingMapping = incoming_account_attributes;
  }

  mapToHubspotEntity(
    hullObject: HubspotReadContact | HubspotReadCompany,
    serviceType: ServiceType
  ) {
    switch (serviceType) {
      case "contact":
        return this.mapToHubspotContact(hullObject);
      case "company":
        return this.mapToHubspotCompany(hullObject);
      default:
    }
    return {};
  }

  mapToHullEntity(
    serviceObject: HubspotReadContact | HubspotReadCompany,
    hullEntity: string
  ) {
    switch (hullEntity) {
      case "user":
        return this.mapToHullUser(serviceObject);
      case "account":
        return this.mapToHullAccount(serviceObject);
      default:
    }
    return {};
  }

  format(value) {
    if (_.isNil(value) || (!_.isNumber(value) && _.isEmpty(value))) {
      return null;
    }
    if (_.isNumber(value)) {
      return value;
    }

    // TODO tmp fix - use castAs
    // eslint-disable-next-line
    if (!isNaN(value) && (_.startsWith(value, "0.") || !_.startsWith(value, "0"))) {
      return parseFloat(value);
    }
    return value;
  }

  mapToHullAccount(accountData: HubspotReadCompany): HullAccountAttributes {
    const { helpers } = this.ctx;
    const { mapAttributes } = helpers;
    const hullTraits = mapAttributes({
      payload: accountData,
      direction: "incoming",
      mapping: this.connector.private_settings.incoming_account_attributes,
      serviceSchema: this.incomingCompanySchema
    });

    hullTraits["hubspot/id"] = accountData.companyId;

    const hubspotName = _.get(accountData, "properties.name.value");
    if (!_.isEmpty(hubspotName)) {
      _.set(hullTraits, "name", {
        value: hubspotName,
        operation: "setIfNull"
      });
    }
    return hullTraits;
  }

  mapToHullUser(hubspotReadContact: HubspotReadContact): HullUserAttributes {
    const { helpers } = this.ctx;
    const { mapAttributes } = helpers;
    const hullTraits = mapAttributes({
      payload: hubspotReadContact,
      direction: "incoming",
      mapping: this.connector.private_settings.incoming_user_attributes,
      serviceSchema: this.incomingConctactSchema
    });

    hullTraits["hubspot/id"] =
      hubspotReadContact["canonical-vid"] || hubspotReadContact.vid;

    if (hullTraits["hubspot/first_name"]) {
      hullTraits.first_name = {
        operation: "setIfNull",
        value: hullTraits["hubspot/first_name"]
      };
    }

    if (hullTraits["hubspot/last_name"]) {
      hullTraits.last_name = {
        operation: "setIfNull",
        value: hullTraits["hubspot/last_name"]
      };
    }
    return hullTraits;
  }

  mapToHubspotContact(message: HullUserUpdateMessage): HubspotWriteContact {
    const hubspotWriteProperties = this.mapToHubspotEntityProperties({
      message,
      hullType: "user",
      serviceType: "contact",
      transform: ({ property, value }) => {
        return { property, value };
      }
    });
    const hubspotWriteContact: HubspotWriteContact = {
      properties: hubspotWriteProperties
    };
    if (message.user["hubspot/id"]) {
      hubspotWriteContact.vid = message.user["hubspot/id"];
    }

    if (message.user.email) {
      hubspotWriteContact.email = message.user.email;
    }
    return hubspotWriteContact;
  }

  mapToHubspotCompany(message: HullAccountUpdateMessage): HubspotWriteCompany {
    const hubspotWriteProperties = this.mapToHubspotEntityProperties({
      message,
      hullType: "account",
      serviceType: "company",
      transform: ({ property, value }) => {
        return { name: property, value };
      }
    });
    const hubspotWriteCompany: HubspotWriteCompany = {
      properties: hubspotWriteProperties
    };
    if (message.account["hubspot/id"]) {
      hubspotWriteCompany.objectId = message.account["hubspot/id"].toString();
    }

    const domainProperties = _.filter(hubspotWriteCompany.properties, {
      name: "domain"
    });

    if (!_.isNil(message.account.domain) && domainProperties.length === 0) {
      hubspotWriteCompany.properties.push({
        name: "domain",
        value: message.account.domain
      });
    }

    return hubspotWriteCompany;
  }

  mapToHubspotEntityProperties({
    message,
    hullType,
    serviceType,
    transform = () => {}
  }: {
    message: HullUserUpdateMessage | HullAccountUpdateMessage,
    hullType: HullType,
    serviceType: ServiceType,
    transform: any
  }): Array<HubspotWriteContactProperty> | Array<HubspotWriteCompanyProperty> {
    const outgoingMapping = this[`${serviceType}OutgoingMapping`];

    const { mapAttributes } = this.ctx.helpers;
    const rawHubspotProperties = mapAttributes({
      entity: hullType,
      payload: message,
      direction: "outgoing",
      mapping: outgoingMapping,
      serviceSchema: this[`outgoing${_.upperFirst(serviceType)}Schema`]
    });

    const properties = _.reduce(
      rawHubspotProperties,
      (r, value, property) => {
        if (_.isNil(value) || value === "") {
          return r;
        }
        return [...r, transform({ property, value })];
      },
      []
    );

    // link to company
    if (
      serviceType === "contact" &&
      this.outgoingLinking &&
      message.account &&
      message.account["hubspot/id"]
    ) {
      properties.push({
        property: "associatedcompanyid",
        value: message.account["hubspot/id"]
      });
    }
    return properties;
  }

  getOutgoingServiceSchema(
    hubspotPropertyGroups: Array<HubspotPropertyGroup>,
    outgoingMapping: Array<HubspotSchema>
  ): Array<> {
    const formatter = (property, type) => value => {
      value = attributeFormatter(value);
      const inferDatetime = _.get(
        this.connector,
        "private_settings.infer_datetime",
        true
      );

      if (
        (/_(at|date)$/.test(property) && inferDatetime) ||
        type === "datetime"
      ) {
        const dateValue = new Date(value).getTime();
        if (dateValue) {
          value = dateValue;
        }
      }

      if (value && type === "date" && moment(value).isValid()) {
        value = moment(value)
          .hours(0)
          .minutes(0)
          .seconds(0)
          .milliseconds(0)
          .format("x");
      }
      return value;
    };

    const hubspotProperties = _.flatten(
      hubspotPropertyGroups.map(group => group.properties)
    );

    return outgoingMapping.reduce((schema, mapping) => {
      const { hull, service } = mapping;
      if (_.isEmpty(hull) || _.isEmpty(service)) {
        return schema;
      }
      const hubspotPropertyName = slug(service, {
        replacement: "_",
        lower: true
      });

      const hubspotProperty = _.find(hubspotProperties, {
        name: hubspotPropertyName
      });

      const { name, label, displayOrder, readOnlyValue, type, fieldType } =
        hubspotProperty || {};
      schema[hubspotPropertyName] = {
        type,
        name: name || hubspotPropertyName,
        label: label || service,
        displayOrder,
        fieldType,
        readOnlyValue,
        formatter: formatter(hubspotPropertyName, type)
      };
      return schema;
    }, {});
  }

  getIncomingServiceSchema(
    hubspotPropertyGroups: Array<HubspotPropertyGroup>,
    attributeMapping: Array<HubspotSchema>
  ): Array<> {
    const formatter = (property, type) => value => {
      if (_.isNil(value) || (!_.isNumber(value) && _.isEmpty(value))) {
        return null;
      }
      if (_.isNumber(value)) {
        return value;
      }

      // eslint-disable-next-line
      if (type === "number") {
        return parseFloat(value);
      }
      return value;
    };

    const hubspotProperties = _.flatten(
      hubspotPropertyGroups.map(group => group.properties)
    );

    return attributeMapping.reduce((schema, mapping) => {
      const { hull, service } = mapping;
      if (_.isEmpty(hull) || _.isEmpty(service)) {
        return schema;
      }
      const cleanedServiceName = service
        .replace(/.*properties\./, "")
        .replace(/\.value.*/, "")
        .replace(/"/g, "")
        .replace(/`/g, "");

      const hubspotPropertyName = slug(cleanedServiceName, {
        replacement: "_",
        lower: true
      });

      const hubspotProperty = _.find(hubspotProperties, {
        name: hubspotPropertyName
      });

      if (hubspotProperty) {
        const { name, type } = hubspotProperty;
        schema[hull.replace(/^traits_/, "")] = {
          type,
          formatter: formatter(name, type)
        };
      }
      return schema;
    }, {});
  }

  getHubspotPropertyKeys({ identityClaims, attributeMapping }): Array<string> {
    const propertyRegex = /.*properties\..*\.value.*/;
    return _.concat(attributeMapping, identityClaims)
      .filter(entry => entry.service && propertyRegex.test(entry.service))
      .map(entry =>
        entry.service
          .replace(/.*properties\./, "")
          .replace(/\.value.*/, "")
          .replace(/"/g, "")
          .replace(/`/g, "")
      );
  }
}

module.exports = MappingUtil;
