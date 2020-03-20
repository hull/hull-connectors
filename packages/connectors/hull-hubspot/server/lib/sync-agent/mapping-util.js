// @flow
import type {
  HullAccountAttributes,
  HullUserAttributes,
  HullConnector,
  HullAccountSegment,
  HullUserSegment,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullIncomingClaimsSetting
} from "hull";

import type {
  HubspotWriteContact,
  HubspotWriteContactProperties,
  HubspotWriteCompany,
  HubspotWriteCompanyProperties,
  HubspotReadContact,
  HubspotReadCompany,
  HubspotContactOutgoingMapping,
  HubspotContactAttributesOutgoingSetting,
  HubspotContactAttributesIncomingSetting,
  HubspotContactIncomingMapping,
  HubspotContactProperty,
  HubspotCompanyProperty,
  HullProperty,
  HubspotCompanyOutgoingMapping,
  HubspotCompanyIncomingMapping,
  HubspotCompanyAttributesIncomingSetting,
  HubspotCompanyAttributesOutgoingSetting
} from "../../types";

const _ = require("lodash");
const moment = require("moment");
const slug = require("slug");
const debug = require("debug")("hull-hubspot:mapping-util");

class MappingUtil {
  connector: HullConnector;

  hullClient: Object;

  logger: Object;

  usersSegments: Array<HullUserSegment>;

  accountsSegments: Array<HullAccountSegment>;

  outgoingLinking: boolean;

  contactOutgoingMapping: Array<HubspotContactOutgoingMapping>;

  contactIncomingMapping: Array<HubspotContactIncomingMapping>;

  companyOutgoingMapping: Array<HubspotCompanyOutgoingMapping>;

  companyIncomingMapping: Array<HubspotCompanyIncomingMapping>;

  incomingUserClaims: Array<HullIncomingClaimsSetting>;

  incomingAccountClaims: Array<HullIncomingClaimsSetting>;

  constructor({
                connector,
                hullClient,
                usersSegments,
                accountsSegments,
                hubspotContactProperties,
                hubspotCompanyProperties,
                hullUserProperties,
                hullAccountProperties
              }: Object) {
    this.connector = connector;
    this.hullClient = hullClient;
    this.logger = hullClient.logger;
    this.usersSegments = usersSegments;
    this.accountsSegments = accountsSegments;

    const { private_settings } = this.connector;
    const {
      incoming_user_attributes,
      outgoing_user_attributes,
      incoming_account_attributes,
      outgoing_account_attributes,
      sync_fields_to_hull, // legacy contact attributes
      sync_fields_to_hubspot, // legacy contact attributes
      link_users_in_service,
      incoming_user_claims,
      incoming_account_claims
    } = private_settings;

    const flatHubspotContactProperties = _.flatten(
      hubspotContactProperties.map(group => group.properties)
    );
    const flatHubspotCompanyProperties = _.flatten(
      hubspotCompanyProperties.map(group => group.properties)
    );

    this.outgoingLinking = link_users_in_service || false;
    this.incomingUserClaims = incoming_user_claims;
    this.incomingAccountClaims = incoming_account_claims;

    this.contactOutgoingMapping = this.getOutgoingMapping(
      flatHubspotContactProperties,
      outgoing_user_attributes || sync_fields_to_hubspot
    );
    this.contactIncomingMapping = this.getIncomingMapping(
      flatHubspotContactProperties,
      hullUserProperties,
      incoming_user_attributes || sync_fields_to_hull
    );
    this.companyOutgoingMapping = this.getOutgoingMapping(
      flatHubspotCompanyProperties,
      outgoing_account_attributes
    );
    this.companyIncomingMapping = this.getIncomingMapping(
      flatHubspotCompanyProperties,
      hullAccountProperties,
      incoming_account_attributes
    );
  }

  getOutgoingMapping(
    hubspotProperties: Array<HubspotContactProperty | HubspotCompanyProperty>,
    outgoingMapping: Array<| HubspotContactAttributesOutgoingSetting
      | HubspotCompanyAttributesOutgoingSetting>
  ): Array<HubspotContactOutgoingMapping> {
    return outgoingMapping.reduce((mappings, mapping) => {
      const { hull, service, name } = mapping;
      const hubspotPropertyLabel = service || name;
      let hubspotPropertyName = slug(service || name, {
        replacement: "_",
        lower: true
      });

      let hubspotProperty = _.find(hubspotProperties, {
        name: hubspotPropertyName
      });

      // check if property was created by hull
      if (_.isNil(hubspotProperty)) {
        hubspotPropertyName = `hull_${hubspotPropertyName}`;
        hubspotProperty = _.find(hubspotProperties, {
          name: hubspotPropertyName
        });
      }

      const { readOnlyValue, type, fieldType, displayOrder } =
      hubspotProperty || {};
      return mappings.concat([
        {
          hull_trait_name: hull,
          hubspot_property_name: hubspotPropertyName,
          hubspot_property_label: hubspotPropertyLabel,
          hubspot_property_read_only: readOnlyValue,
          hubspot_property_type: type,
          hubspot_property_field_type: fieldType,
          hubspot_property_display_order: displayOrder
        }
      ]);
    }, []);
  }

  getIncomingMapping(
    hubspotProperties: Array<HubspotContactProperty | HubspotCompanyProperty>,
    hullProperties: Array<HullProperty>,
    incomingMapping: Array<| HubspotContactAttributesIncomingSetting
      | HubspotCompanyAttributesIncomingSetting>
  ): Array<HubspotContactIncomingMapping> {
    return incomingMapping.reduce((mapping, setting) => {
      if ((!setting.name && !setting.service) || !setting.hull) {
        return mapping;
      }
      const hullTrait = hullProperties[setting.hull];
      const hubspotContactProperty = _.find(hubspotProperties, {
        name: setting.service || setting.name
      });
      if (hubspotContactProperty === undefined) {
        return mapping;
      }
      return mapping.concat([
        {
          hull_trait_name: setting.hull,
          hull_trait_type: hullTrait && hullTrait.type,
          hubspot_property_name: setting.service || setting.name,
          hubspot_property_read_only: hubspotContactProperty.readOnlyValue,
          hubspot_property_type: hubspotContactProperty.type,
          hubspot_property_field_type: hubspotContactProperty.fieldType
        }
      ]);
    }, []);
  }

  mapToHubspotEntity(
    hullObject: HubspotReadContact | HubspotReadCompany,
    serviceType: string
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

  /**
   * Returns the Hubspot properties names.
   * When doing a sync we need to download only those
   * @return {Array}
   */
  getHubspotContactPropertiesKeys(): Array<string> {
    const propertiesFromClaims = this.incomingUserClaims
      .filter(entry => (entry.service || "").indexOf("properties.") === 0)
      .map(entry => (entry.service || "").replace(/properties\./, ""))
      .map(service => service.replace(/\.value/, ""));
    return this.contactIncomingMapping
      .map(prop => prop.hubspot_property_name)
      .concat(propertiesFromClaims);
  }

  /**
   * Returns the Hull traits names.
   * Useful when doing request extract calls
   * @return {Array}
   */
  getHullUserTraitsKeys(): Array<string> {
    return this.contactOutgoingMapping.map(prop => prop.hull_trait_name);
  }

  getHubspotCompanyPropertiesKeys(): Array<string> {
    const propertiesFromClaims = this.incomingAccountClaims
      .filter(entry => (entry.service || "").indexOf("properties.") === 0)
      .map(entry => (entry.service || "").replace(/properties\./, ""))
      .map(service => service.replace(/\.value/, ""));
    return this.companyIncomingMapping
      .map(prop => prop.hubspot_property_name)
      .concat(propertiesFromClaims);
  }

  getHullAccountTraitsKeys(): Array<string> {
    return this.companyOutgoingMapping.map(prop => prop.hull_trait_name);
  }

  mapToHullAccount(accountData: HubspotReadCompany): HullAccountAttributes {
    const hullTraits = _.reduce(
      this.companyIncomingMapping,
      (traits, mappingEntry) => {
        const {
          hull_trait_name,
          hubspot_property_name,
          hubspot_property_type,
          hubspot_property_field_type
        } = mappingEntry;
        if (
          accountData.properties &&
          _.has(accountData.properties, hubspot_property_name)
        ) {
          let val = _.get(
            accountData,
            `properties[${hubspot_property_name}].value`
          );
          if (hubspot_property_type === "number") {
            const numVal = parseFloat(val);
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(val)) {
              val = numVal;
            }
          }

          if (
            hubspot_property_type === "enumeration" &&
            hubspot_property_field_type === "checkbox" &&
            typeof val === "string"
          ) {
            val = val.split(";");
          }
          traits[hull_trait_name] = val;
        }
        return traits;
      },
      {}
    );

    hullTraits["hubspot/id"] = accountData.companyId;

    const hubspotName = _.get(accountData, "properties.name.value");
    if (!_.isEmpty(hubspotName)) {
      _.set(hullTraits, "name", {
        value: hubspotName,
        operation: "setIfNull"
      });
    }

    debug("getHullTraits", hullTraits);
    return hullTraits;
  }

  /**
   * Maps Hubspot contact properties to Hull traits
   * @param  {Object} userData Hubspot contact
   * @return {Object}          Hull user traits
   */
  mapToHullUser(userData: HubspotReadContact): HullUserAttributes {
    const properties = userData.properties;
    const hullTraits = _.reduce(
      this.contactIncomingMapping,
      (traits, mappingEntry) => {
        const {
          hull_trait_name,
          hubspot_property_name,
          hubspot_property_type,
          hubspot_property_field_type
        } = mappingEntry;

        let val = null;
        if (_.startsWith(hubspot_property_name, "contact_meta.")) {
          const metaKey = hubspot_property_name.split("contact_meta.")[1];
          val = _.get(userData, metaKey, null);
        } else if (properties && _.has(properties, hubspot_property_name)) {
          const propertiesKey = `properties[${hubspot_property_name}].value`;
          val = _.get(userData, propertiesKey, null);
        }

        if (!_.isNil(val)) {
          if (hubspot_property_type === "number") {
            const numVal = parseFloat(val);
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(val)) {
              val = numVal;
            }
          }

          if (
            hubspot_property_type === "enumeration" &&
            hubspot_property_field_type === "checkbox" &&
            typeof val === "string"
          ) {
            val = val.split(";");
          }
        }
        traits[hull_trait_name] = val;

        return traits;
      },
      {}
    );

    hullTraits["hubspot/id"] = userData["canonical-vid"] || userData.vid;

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
    debug("getHullTraits", hullTraits);
    return hullTraits;
  }

  mapToHubspotEntityProperties(
    message: HullUserUpdateMessage | HullAccountUpdateMessage,
    hullType: string,
    serviceType: string
  ): HubspotWriteContactProperties | HubspotWriteCompanyProperties {
    const hullEntity = _.get(message, hullType);
    const field = serviceType === "contact" ? "property" : "name";
    const outgoingMapping = this[`${serviceType}OutgoingMapping`];
    const properties = _.reduce(
      outgoingMapping,
      (hubspotProperties, mappingEntry) => {
        const {
          hull_trait_name,
          hubspot_property_name,
          hubspot_property_type,
          hubspot_property_read_only
        } = mappingEntry;

        // TODO check how this would this be null
        if (_.isNil(hubspot_property_name)) {
          return hubspotProperties;
        }

        let value = _.get(hullEntity, hull_trait_name);

        if (
          (/_(at|date)$/.test(hull_trait_name) ||
            hubspot_property_type === "datetime") &&
          typeof value === "string"
        ) {
          const dateValue = new Date(value).getTime();
          if (dateValue) {
            value = dateValue;
          }
        }

        if (Array.isArray(value)) {
          value = value.join(";");
        } else if (_.isPlainObject(value)) {
          value = JSON.stringify(value);
        }

        if (value && hubspot_property_type === "date") {
          if (moment(value).isValid()) {
            value = moment(value)
              .hours(0)
              .minutes(0)
              .seconds(0)
              .milliseconds(0)
              .format("x");
          }
        }

        if (!_.isNil(value) && value !== "" && !hubspot_property_read_only) {
          hubspotProperties.push({
            [`${field}`]: hubspot_property_name,
            value
          });
        }
        return hubspotProperties;
      },
      []
    );

    const segments =
      hullType === "user" ? message.segments : message.account_segments;
    const globalSegments =
      hullType === "user" ? this.usersSegments : this.accountsSegments;
    const segmentNames = _.uniq(
      segments.map(segment => {
        return _.trim(
          _.get(_.find(globalSegments, { id: segment.id }), "name")
        );
      })
    );

    properties.push({
      [`${field}`]: "hull_segments",
      value: segmentNames.join(";")
    });

    // link to company
    if (serviceType === "contact") {
      if (
        this.outgoingLinking === true &&
        message.account &&
        message.account["hubspot/id"]
      ) {
        properties.push({
          [`${field}`]: "associatedcompanyid",
          value: message.account["hubspot/id"]
        });
      }
    }

    return properties;
  }

  mapToHubspotContact(message: HullUserUpdateMessage): HubspotWriteContact {
    const hubspotWriteProperties = this.mapToHubspotEntityProperties(
      message,
      "user",
      "contact"
    );
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
    const hubspotWriteProperties = this.mapToHubspotEntityProperties(
      message,
      "account",
      "company"
    );
    const hubspotWriteCompany: HubspotWriteCompany = {
      properties: hubspotWriteProperties
    };
    if (
      message.account["hubspot/id"] !== null &&
      message.account["hubspot/id"] !== undefined
    ) {
      hubspotWriteCompany.objectId = message.account["hubspot/id"].toString();
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
}

module.exports = MappingUtil;
