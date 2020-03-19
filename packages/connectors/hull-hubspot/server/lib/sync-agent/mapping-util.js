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
      hullUserProperties,
      outgoing_user_attributes || sync_fields_to_hubspot
    );
    this.contactIncomingMapping = this.getIncomingMapping(
      flatHubspotContactProperties,
      hullUserProperties,
      incoming_user_attributes || sync_fields_to_hull
    );
    this.companyOutgoingMapping = this.getOutgoingMapping(
      flatHubspotCompanyProperties,
      hullAccountProperties,
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
    hullProperties: Array<HullProperty>,
    outgoingMapping: Array<
      | HubspotContactAttributesOutgoingSetting
      | HubspotCompanyAttributesOutgoingSetting
    >
  ): Array<HubspotContactOutgoingMapping> {
    return outgoingMapping.reduce((mapping, setting) => {
      if ((!setting.name && !setting.service) || !setting.hull) {
        return mapping;
      }

      // let's generate a slug version of the hubspot property
      let hubspotPropertyName = slug(setting.service || setting.name, {
        replacement: "_",
        lower: true
      });

      // let's try to find an existing contact property directly by slug
      let hubspotContactProperty = _.find(hubspotProperties, {
        name: hubspotPropertyName
      });

      // if we couldn't find the existing contact property
      // we will prepend it with `hull_` and see if this was
      // a property created by this connector
      if (hubspotContactProperty === undefined) {
        hubspotPropertyName = `hull_${hubspotPropertyName}`;
        hubspotContactProperty = _.find(hubspotProperties, {
          name: hubspotPropertyName
        });
      }

      const hullTrait =
        _.find(hullProperties, { id: setting.hull }) ||
        _.find(hullProperties, { id: setting.hull.replace("account.", "") }) ||
        _.find(hullProperties, { id: `traits_${setting.hull}` });
      if (hullTrait === undefined) {
        return mapping;
      }

      return mapping.concat([
        {
          hull_trait_name: setting.hull,
          hull_default_trait_name: null,
          hull_trait_type: hullTrait.type,
          hubspot_property_name: hubspotPropertyName,
          hubspot_property_label: setting.service || setting.name,
          hubspot_property_read_only:
            hubspotContactProperty && hubspotContactProperty.readOnlyValue,
          hubspot_property_type:
            hubspotContactProperty && hubspotContactProperty.type,
          hubspot_property_field_type:
            hubspotContactProperty && hubspotContactProperty.fieldType,
          hubspot_property_display_order:
            hubspotContactProperty && hubspotContactProperty.displayOrder
        }
      ]);
    }, []);
  }

  getIncomingMapping(
    hubspotProperties: Array<HubspotContactProperty | HubspotCompanyProperty>,
    hullProperties: Array<HullProperty>,
    incomingMapping: Array<
      | HubspotContactAttributesIncomingSetting
      | HubspotCompanyAttributesIncomingSetting
    >
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

  getHullAccountTraits(accountData: HubspotReadCompany): HullAccountAttributes {
    const hullTraits = _.reduce(
      this.companyIncomingMapping,
      (traits, mappingEntry) => {
        if (!mappingEntry.hubspot_property_name) {
          this.hullClient
            .asAccount(_.pick(accountData, ["id", "external_id", "domain"]))
            .logger.warn("incoming.account.warning", {
              warning: "cannot find mapped hubspot property",
              mappingEntry
            });
        }
        if (
          accountData.properties &&
          _.has(accountData.properties, mappingEntry.hubspot_property_name)
        ) {
          let val = _.get(
            accountData,
            `properties[${mappingEntry.hubspot_property_name}].value`
          );
          if (mappingEntry.hubspot_property_type === "number") {
            const numVal = parseFloat(val);
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(val)) {
              val = numVal;
            }
          }

          if (
            mappingEntry.hubspot_property_type === "enumeration" &&
            mappingEntry.hubspot_property_field_type === "checkbox" &&
            typeof val === "string"
          ) {
            val = val.split(";");
          }
          traits[mappingEntry.hull_trait_name] = val;
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
  getHullUserTraits(userData: HubspotReadContact): HullUserAttributes {
    const properties = userData.properties;
    const hullTraits = _.reduce(
      this.contactIncomingMapping,
      (traits, mappingEntry) => {
        const hullTraitName = mappingEntry.hull_trait_name;
        const hsPropertyName = mappingEntry.hubspot_property_name;
        const hsPropertyType = mappingEntry.hubspot_property_type;
        const hsPropertyFieldType = mappingEntry.hubspot_property_field_type;

        if (_.isNil(hsPropertyName)) {
          this.hullClient
            .asUser(_.pick(userData, ["id", "external_id", "email"]))
            .logger.warn("incoming.user.warning", {
              warning: "cannot find mapped hubspot property",
              mappingEntry
            });
        }

        let val = null;
        if (_.startsWith(hsPropertyName, "contact_meta.")) {
          const metaKey = hsPropertyName.split("contact_meta.")[1];
          val = _.get(userData, metaKey, null);
        } else if (properties && _.has(properties, hsPropertyName)) {
          const propertiesKey = `properties[${hsPropertyName}].value`;
          val = _.get(userData, propertiesKey, null);
        }

        if (!_.isNil(val)) {
          if (hsPropertyType === "number") {
            const numVal = parseFloat(val);
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(val)) {
              val = numVal;
            }
          }

          if (
            hsPropertyType === "enumeration" &&
            hsPropertyFieldType === "checkbox" &&
            typeof val === "string"
          ) {
            val = val.split(";");
          }
        }
        traits[hullTraitName] = val;

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

  getHubspotContact(message: HullUserUpdateMessage): HubspotWriteContact {
    const hubspotWriteProperties = this.getHubspotContactProperties(message);
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

  getHubspotCompany(message: HullAccountUpdateMessage): HubspotWriteCompany {
    const hubspotWriteProperties = this.getHubspotCompanyProperties(message);
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

  /**
   * Maps Hull user data to Hubspot contact properties.
   * It sends only the properties which are not read only - this is controlled
   * by the mapping.
   * @see http://developers.hubspot.com/docs/methods/contacts/update_contact
   * @param  {Object} userData Hull user object
   * @return {Array}           Hubspot properties array
   */
  getHubspotContactProperties(
    userMessage: HullUserUpdateMessage
  ): HubspotWriteContactProperties {
    const userData = userMessage.user;
    debug("getHubspotContactProperties", this.contactOutgoingMapping);
    // const userSegments = this.userSegments;
    const userChanges = _.get(userMessage, "changes.user", null);
    const contactProps = _.reduce(
      this.contactOutgoingMapping,
      (contactProperties, mappingEntry) => {
        // const hubspotProp = this.findHubspotProp(hubspotProperties, prop);
        const userIdent = _.pick(userData, ["id", "external_id", "email"]);

        if (!mappingEntry.hubspot_property_name) {
          this.hullClient
            .asUser(userIdent)
            .logger.warn("outgoing.user.warning", {
              warning: "cannot find mapped hubspot property",
              mappingEntry
            });
          return contactProperties;
        }

        let value = _.get(userData, mappingEntry.hull_trait_name);

        if (
          (/_(at|date)$/.test(mappingEntry.hull_trait_name) ||
            mappingEntry.hubspot_property_type === "datetime") &&
          typeof value === "string"
        ) {
          const dateValue = new Date(value).getTime();
          if (dateValue) value = dateValue;
        }

        if (Array.isArray(value)) {
          value = value.join(";");
        } else if (_.isPlainObject(value)) {
          value = JSON.stringify(value);
        }

        if (value && mappingEntry.hubspot_property_type === "date") {
          // try to parse the date/time to date only
          if (moment(value).isValid()) {
            value = moment(value)
              .hours(0)
              .minutes(0)
              .seconds(0)
              .milliseconds(0)
              .format("x");
          } else {
            this.hullClient
              .asUser(userIdent)
              .logger.warn("outgoing.user.warning", {
                warning: "cannot parse datetime trait to date",
                mappingEntry
              });
          }
        }

        if (
          !_.isNil(value) &&
          value !== "" &&
          mappingEntry.hubspot_property_read_only !== true
        ) {
          contactProperties.push({
            property: mappingEntry.hubspot_property_name,
            value
          });
        } else if (
          _.isNil(value) &&
          mappingEntry.hubspot_property_read_only === false
        ) {
          this.hullClient.logger.debug(
            "User attribute not found in hull notification",
            {
              hull_trait_name: mappingEntry.hull_trait_name,
              hubspot_property_name: mappingEntry.hubspot_property_name,
              user_identity: userIdent
            }
          );
        }
        if (userChanges) {
          const userChange = _.get(
            userChanges,
            mappingEntry.hubspot_property_name,
            null
          );
          if (_.isArray(userChange) && userChange[1] === null) {
            this.hullClient.logger.debug("Setting NULL for user attribute", {
              hull_trait_name: mappingEntry.hull_trait_name,
              hubspot_property_name: mappingEntry.hubspot_property_name,
              user_identity: userIdent
            });
          }
        }
        return contactProperties;
      },
      []
    );

    // handle segments
    const userSegments: Array<HullUserSegment> = Array.isArray(
      userMessage.segments
    )
      ? userMessage.segments
      : [];
    debug("userSegments", userMessage.segments);
    const segmentNames = _.uniq(
      userSegments.map(segment => {
        return _.trim(
          _.get(_.find(this.usersSegments, { id: segment.id }), "name")
        );
      })
    );
    debug("segmentNames", segmentNames);

    contactProps.push({
      property: "hull_segments",
      value: segmentNames.join(";")
    });

    // link to company
    if (
      this.outgoingLinking === true &&
      userMessage.account &&
      userMessage.account["hubspot/id"]
    ) {
      contactProps.push({
        property: "associatedcompanyid",
        value: userMessage.account["hubspot/id"]
      });
    }

    return contactProps;
  }

  getHubspotCompanyProperties(
    message: HullAccountUpdateMessage
  ): HubspotWriteCompanyProperties {
    debug("getHubspotCompanyProperties", this.companyOutgoingMapping);
    // const userSegments = this.userSegments;
    const accountData = message.account;
    const accountChanges = _.get(message, "changes.account", null);
    const contactProps = _.reduce(
      this.companyOutgoingMapping,
      (contactProperties, mappingEntry) => {
        // const hubspotProp = this.findHubspotProp(hubspotProperties, prop);
        const accountIdent = _.pick(accountData, [
          "id",
          "external_id",
          "domain"
        ]);

        if (!mappingEntry.hubspot_property_name) {
          this.hullClient
            .asAccount(accountIdent)
            .logger.warn("outgoing.user.warning", {
              warning: "cannot find mapped hubspot property",
              mappingEntry
            });
          return contactProperties;
        }

        let value = _.has(accountData, mappingEntry.hull_trait_name)
          ? _.get(accountData, mappingEntry.hull_trait_name)
          : _.get({ account: accountData }, mappingEntry.hull_trait_name);

        if (
          /_(at|date)$/.test(mappingEntry.hull_trait_name) ||
          mappingEntry.hubspot_property_type === "datetime"
        ) {
          const dateValue = new Date(value).getTime();
          if (dateValue) value = dateValue;
        }

        if (Array.isArray(value)) {
          value = value.join(";");
        } else if (_.isPlainObject(value)) {
          value = JSON.stringify(value);
        }

        if (value && mappingEntry.hubspot_property_type === "date") {
          // try to parse the date/time to date only
          if (moment(value).isValid()) {
            value = moment(value)
              .utc()
              .hours(0)
              .minutes(0)
              .seconds(0)
              .milliseconds(0)
              .format("x");
          } else {
            this.hullClient
              .asAccount(accountIdent)
              .logger.warn("outgoing.account.warning", {
                warning: "cannot parse datetime trait to date",
                mappingEntry
              });
          }
        }

        if (
          !_.isNil(value) &&
          value !== "" &&
          mappingEntry.hubspot_property_read_only !== true
        ) {
          contactProperties.push({
            name: mappingEntry.hubspot_property_name,
            value
          });
        } else if (
          _.isNil(value) &&
          mappingEntry.hubspot_property_read_only === false
        ) {
          this.hullClient.logger.debug(
            "Account attribute not found in hull notification",
            {
              hull_trait_name: mappingEntry.hull_trait_name,
              hubspot_property_name: mappingEntry.hubspot_property_name,
              account_identity: accountIdent
            }
          );
        }
        if (accountChanges) {
          const accountChange = _.get(
            accountChanges,
            mappingEntry.hubspot_property_name,
            null
          );
          if (_.isArray(accountChange) && accountChange[1] === null) {
            this.hullClient.logger.debug("Setting NULL for account attribute", {
              hull_trait_name: mappingEntry.hull_trait_name,
              hubspot_property_name: mappingEntry.hubspot_property_name,
              account_identity: accountIdent
            });
          }
        }
        return contactProperties;
      },
      []
    );

    const accountSegments: Array<HullAccountSegment> = Array.isArray(
      message.account_segments
    )
      ? message.account_segments
      : [];
    debug("accountSegments", accountSegments, this.accountsSegments);
    const segmentNames = _.uniq(
      accountSegments.map(segment => {
        return _.trim(
          _.get(_.find(this.accountsSegments, { id: segment.id }), "name")
        );
      })
    );
    debug("segmentNames", segmentNames);

    contactProps.push({
      name: "hull_segments",
      value: segmentNames.join(";")
    });

    return contactProps;
  }
}

module.exports = MappingUtil;
