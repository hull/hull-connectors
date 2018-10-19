/* @flow */
import type {
  HullUser,
  HullAccount,
  HullAccountClaims,
  HullUserClaims,
  HullAccountAttributes,
  HullUserAttributes
} from "hull";

import type {
  OutreachOutboundMapping,
  OutreachConnectorSettings,
  OutreachAccountReadData,
  OutreachProspectReadData,
  OutreachAccountWrite,
  OutreachProspectWrite,
  OutreachAccountWriteData,
  OutreachProspectWriteData,
  OutreachAccountUpdateEnvelope,
  OutreachProspectUpdateEnvelope,
  OutreachAccountAttributes,
  OutreachProspectAttributes
} from "../types";

const _ = require("lodash");
const { URL } = require("url");
const debug = require("debug")("hull-outreach:mapping-util");

class MappingUtil {
  /**
   * Gets or set the attribute mappings for all object types.
   *
   * @type {OutreachConnectorSettings}
   * @memberof MappingUtil
   */
  settings: OutreachConnectorSettings;

  /**
   *Creates an instance of MappingUtil.
   * @param {CioMappingUtilSettings} settings The settings to configure the util.
   * @memberof MappingUtil
   */
  constructor(settings: OutreachConnectorSettings) {
    this.settings = settings;
  }

  mapOutreachAccountToHullAccountIdent(
    account: OutreachAccountReadData
  ): HullAccountClaims {
    const ident: HullAccountClaims = {};

    const accountIdentifierHull = this.settings.account_identifier_hull;
    const accountIdentifierService = this.settings.account_identifier_service;

    //  TODO this logic seems suspect, we should probably agree how this works typically and all the connectors inherit the logic
    if (
      accountIdentifierHull === "domain" &&
      typeof account[accountIdentifierService] === "string"
    ) {
      ident.domain = this.normalizeUrl(account[accountIdentifierService]);
    } else if (accountIdentifierHull === "external_id") {
      ident[accountIdentifierHull] = account[accountIdentifierService];
      if (typeof account.attributes.domain === "string") {
        ident.domain = this.normalizeUrl(account.attributes.domain);
      }
    }

    ident.anonymous_id = `outreach:${account.id}`;
    return ident;
  }

  /**
   * Maps a outreach.io object to an object of traits that can be sent to
   * the Hull platform.
   * Note: This is not a Hull user or account object
   *
   * @param {TResourceType} resource The name of the close.io resource.
   * @param {*} sObject The close.io object.
   * @returns {*} The object containing the information about the traits to set.
   * @memberof AttributesMapper
   */
  mapOutreachAccountToHullAccountAttributes(
    account: OutreachAccountReadData
  ): HullAccountAttributes {
    const mapping = this.settings.account_attributes_inbound || [];

    const hObject: HullAccountAttributes = this.applyIncomingHullAttributeMapping(
      mapping,
      account.attributes
    );

    // Ensure that we always set the id from outreach.io
    if (_.has(account, "id")) {
      hObject["outreach/id"] = {
        value: _.get(account, "id"),
        operation: "set"
      };
    }

    // see if outreach has a name value, and use it to set, but only if in hull system is null
    if (
      hObject["outreach/name"] &&
      hObject["outreach/name"].value &&
      typeof hObject["outreach/name"].value === "string"
    ) {
      hObject.name = {
        value: hObject["outreach/name"].value,
        operation: "setIfNull"
      };
    }

    // There are special attributes which we should set specifically
    if (_.has(account, "attributes.createdAt")) {
      hObject["outreach/created_at"] = {
        value: account.attributes.createdAt,
        operation: "setIfNull"
      };
    }

    if (_.has(account, "attributes.updatedAt")) {
      hObject["outreach/updated_at"] = {
        value: account.attributes.updatedAt,
        operation: "set"
      };
    }

    return hObject;
  }

  mapOutreachProspectToHullUserIdent(
    prospect: OutreachProspectReadData
  ): HullUserClaims {
    const ident: HullUserClaims = {};

    //  TODO need to confirm with sven about this logic....
    //  it currently has a lot of caveats...

    if (!_.isEmpty(prospect.attributes.emails)) {
      // We cannot say for sure which email address is the proper one,
      // so stick to anonymous_id
      if (prospect.attributes.emails.length > 1) {
        if (_.isEmpty(prospect.attributes.externalId)) {
          // TODO how do I throw an exception here?
        } else {
          ident.external_id = prospect.attributes.externalId;
        }
      } else {
        ident.email = prospect.attributes.emails[0];
      }
    } else {
      // if no emails, fallback to externalId, and set even if it's empty
      ident.external_id = prospect.attributes.externalId;
    }

    ident.anonymous_id = `outreach:${prospect.id}`;

    return ident;
  }

  mapOutreachProspectToHullUserAttributes(
    prospect: OutreachProspectReadData
  ): HullUserAttributes {
    const mapping = this.settings.prospect_attributes_inbound || [];
    const hObject: HullUserAttributes = this.applyIncomingHullAttributeMapping(
      mapping,
      prospect.attributes
    );

    // TODO make sure this is happening.... Ensure that we always set the id from outreach.io
    // this seems sort of redundant...
    if (_.has(prospect, "id")) {
      hObject["outreach/id"] = {
        value: _.get(prospect, "id"),
        operation: "set"
      };
    }

    // TODO clean this up
    if (
      hObject["outreach/name"] &&
      hObject["outreach/name"].value &&
      typeof hObject["outreach/name"].value === "string"
    ) {
      hObject.name = {
        value: hObject["outreach/name"].value,
        operation: "setIfNull"
      };
    }

    return hObject;
  }

  mapOutreachProspectToHullAccountIdent(
    prospect: OutreachProspectReadData
  ): HullAccountClaims {
    const ident: HullAccountClaims = {};
    const accountId = _.get(prospect, "relationships.account.data.id");
    if (accountId !== null) {
      ident.anonymous_id = `outreach:${accountId}`;
    }
    return ident;
  }

  /**
   * Creates a human readable field name if the field is a custom lead field.
   *
   * @param {string} field The technical name of the field.
   * @returns {string} A human-readable field name.
   * @memberof AttributesMapper
   */
  getHumanFieldName(field: string): string {
    const humanName = _.snakeCase(field);
    debug("getHumanFieldName", field, humanName);
    return humanName;
  }

  mapHullAccountToOutreachAccount(
    envelope: OutreachAccountUpdateEnvelope
  ): OutreachAccountWrite {
    const hullAccount = envelope.hullAccount;
    const accountAttributes: OutreachAccountAttributes = {};
    const writeData: OutreachAccountWriteData = {
      type: "account",
      attributes: accountAttributes
    };

    if (_.has(envelope, "outreachAccountId")) {
      writeData.id = envelope.outreachAccountId;
    }

    // Customized mapping
    const mappings = this.settings.account_attributes_outbound || [];

    this.applyOutgoingHullAttributeMapping(
      mappings,
      hullAccount,
      accountAttributes
    );

    return { data: writeData };
  }

  mapHullUserToOutreachProspect(
    envelope: OutreachProspectUpdateEnvelope
  ): OutreachProspectWrite {
    const hullUser = envelope.hullUser;
    const prospectAttributes: OutreachProspectAttributes = {};
    const writeData: OutreachProspectWriteData = {
      type: "prospect",
      attributes: prospectAttributes
    };

    // look to see if the hullUser is linked to an account which has been sync'd to outreach
    if (_.has(hullUser, "account.outreach/id")) {
      _.set(writeData, "relationships.account.data", {
        type: "account",
        id: _.get(hullUser, "account.outreach/id")
      });
    }

    // if there is a specific outreach, then set it as a special field to be used by service client on update
    // I don't remember which scenario this covers, but others are covered in filter-util when determining update/insert
    if (_.has(hullUser, "outreach/id")) {
      envelope.outreachProspectId = envelope.hullUser["outreach/id"];
    }

    // Customized mapping
    const mappings = this.settings.prospect_attributes_outbound || [];

    this.applyOutgoingHullAttributeMapping(
      mappings,
      hullUser,
      prospectAttributes
    );

    return { data: writeData };
  }

  applyIncomingHullAttributeMapping(
    mapping: Array<string>,
    attributes: OutreachAccountAttributes | OutreachProspectAttributes
  ): HullAccountAttributes | HullUserAttributes {
    return mapping.reduce(
      (hullAttrs: HullAccountAttributes | HullUserAttributes, m: string) => {
        /* eslint-disable no-case-declarations */
        switch (m) {
          case "emails":
          case "phones":
          case "voipPhones":
          case "workPhones":
          case "mobilePhones":
          case "homePhones":
          case "tags":
            // These are arrays, so we flatten them
            const arrayVal = _.get(attributes, m, []);
            _.forEach(arrayVal, (v, index) => {
              // We use slice to take off the s because it's plural...
              hullAttrs[`outreach/${m.slice(0, -1)}_${index}`] = {
                // TODO need to test this to make sure that this is putting in the right stuff
                value: v,
                operation: "set"
              };
            });
            break;
          default:
            if (!_.isNil(_.get(attributes, m))) {
              hullAttrs[`outreach/${this.getHumanFieldName(m)}`] = {
                value: _.get(attributes, m),
                operation: "set"
              };
            }
        }
        /* eslint-enable no-case-declarations */
        return hullAttrs;
      },
      {}
    );
  }

  /**
   * Right now the only way to set particular fields is to map the fields manually by hand
   * which is what we think we want otherwise other systems could get flooded by attributes
   *
   * @param {*} objType
   * @param {*} hullObject
   * @param {*} svcObject
   */
  applyOutgoingHullAttributeMapping(
    mappings: Array<OutreachOutboundMapping>,
    hullObject: HullAccount | HullUser,
    attributes: OutreachAccountAttributes | OutreachProspectAttributes
  ) {
    _.forEach(mappings, (m: OutreachOutboundMapping) => {
      const hullAttribValue = _.get(hullObject, m.hull_field_name);
      if (!_.isNil(hullAttribValue)) {
        const svcAttribName = _.get(m, "outreach_field_name");

        // For the array values, we need to add them to set them as an array
        // have to make sure that for each of these values, the name matches...
        // TODO this is destructive!  It will overwrite all values in the array
        // Ask sven if we need to do something crazy like pull attributes and merge arrays before updating
        // Or could see if we've sync'd already and merge with outreach/arrayname and send back
        if (
          // Do not allow setting of emails... too dangerous as it is tied to identity
          // _.startsWith(svcAttribName, "emails") ||
          _.startsWith(svcAttribName, "phones") ||
          _.startsWith(svcAttribName, "voipPhones") ||
          _.startsWith(svcAttribName, "workPhones") ||
          _.startsWith(svcAttribName, "mobilePhones") ||
          _.startsWith(svcAttribName, "homePhones") ||
          _.startsWith(svcAttribName, "tags")
        ) {
          attributes[svcAttribName] = [hullAttribValue];
        } else {
          // Regular case, just set whatever we get from hull to the field
          attributes[svcAttribName] = hullAttribValue;
        }
      }
    });
  }

  /**
   * Normalizes the url by stripping everything
   * except hostname.
   *
   * @param {string} original The original url string.
   * @returns {string} The normalized url.
   * @memberof AttributesMapper
   */
  normalizeUrl(original: string): string {
    try {
      const closeUrl = new URL(original);
      return closeUrl.hostname;
    } catch (error) {
      return original;
    }
  }
}

module.exports = MappingUtil;
