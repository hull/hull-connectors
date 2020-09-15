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

    // TODO combine outgoing/incoming schema handling
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

  mapToHullAccount(accountData: HubspotReadCompany): HullAccountAttributes {
    const { helpers } = this.ctx;
    const { mapAttributes } = helpers;
    const hullTraits = mapAttributes({
      payload: accountData,
      direction: "incoming",
      mapping: this.connector.private_settings.incoming_account_attributes,
      serviceSchema: this.incomingCompanySchema
    });

    const idMapping = _.find(
      this.connector.private_settings.incoming_account_attributes,
      mapping => {
        const { service, hull } = mapping;
        if (_.isEmpty(service) || _.isEmpty(hull)) {
          return false;
        }
        return service === "companyId";
      }
    );

    if (_.isNil(idMapping)) {
      hullTraits["hubspot/id"] = accountData.companyId;
    }

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

    // TODO do not do this
    const idMapping = _.find(
      this.connector.private_settings.incoming_user_attributes,
      mapping => {
        const { service, hull } = mapping;
        if (_.isEmpty(service) || _.isEmpty(hull)) {
          return false;
        }
        return (
          mapping.service === "`canonical-vid` ? `canonical-vid` : `vid`" ||
          mapping.service === "canonical-vid" ||
          mapping.service === "vid"
        );
      }
    );

    if (_.isNil(idMapping)) {
      hullTraits["hubspot/id"] =
        hubspotReadContact["canonical-vid"] || hubspotReadContact.vid;
    }

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

    const hubspotIdMapping = this.getHubspotIdMapping("user");
    const { hull = "hubspot/id" } = hubspotIdMapping || {};
    const hubspotId = hull.replace(/^traits_/, "");
    if (message.user[hubspotId]) {
      hubspotWriteContact.vid = message.user[hubspotId];
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

    const hubspotIdMapping = this.getHubspotIdMapping("account");
    const { hull = "hubspot/id" } = hubspotIdMapping || {};
    if (message.account[hull]) {
      hubspotWriteCompany.objectId = message.account[hull].toString();
    }

    const domainProperties = _.filter(hubspotWriteCompany.properties, {
      name: "domain"
    });

    if (domainProperties.length === 0) {
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
      serviceSchema: this[`outgoing${_.upperFirst(serviceType)}Schema`],
      attributeFormatter
    });

    const properties = _.reduce(
      rawHubspotProperties,
      (r, value, property) => {
        // TODO check if property is in reference group
        if (
          _.isNil(value) ||
          value === "" ||
          property === "hubspot_entity_id"
        ) {
          return r;
        }
        return [...r, transform({ property, value })];
      },
      []
    );

    // link to company
    if (serviceType === "contact" && this.outgoingLinking && message.account) {
      const hubspotIdMapping = this.getHubspotIdMapping("account");

      const { hull = "hubspot/id" } = hubspotIdMapping || {};
      if (message.account[hull]) {
        properties.push({
          property: "associatedcompanyid",
          value: message.account[hull]
        });
      }
    }
    return properties;
  }

  getHubspotIdMapping(hullType) {
    return (
      _.findLast(
        this.connector.private_settings[
          `outgoing_${_.toLower(hullType)}_attributes`
        ],
        attribute => {
          return attribute.service === "hubspot_entity_id";
        }
      ) || { hull: "hubspot/id" }
    );
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

      // TODO if service field is in Reference Field Group
      if (
        _.isEmpty(hull) ||
        _.isEmpty(service) ||
        service === "hubspot_entity_id"
      ) {
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
