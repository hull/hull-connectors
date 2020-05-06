/* @flow */
import type { HullEvent, HullUser, HullSegment, HullUserClaims } from "hull";
import type {
  IMappingUtilOptions,
  ICustomerIoEvent,
  TCustomerIoCustomer
} from "../types";

const _ = require("lodash");
const moment = require("moment");

const HashUtil = require("./hash-util");

const EVENTTYPE_MAPPINGS = {
  customer_subscribed: "Customer Subscribed",
  customer_unsubscribed: "Customer Unsubscribed",
  email_attempted: "Email Attempted",
  email_bounced: "Email Bounced",
  email_clicked: "Email Link Clicked",
  email_converted: "Email Converted",
  email_deferred: "Email Deferred",
  email_delivered: "Email Delivered",
  email_drafted: "Email Drafted",
  email_dropped: "Email Dropped",
  email_failed: "Email Failed",
  email_opened: "Email Opened",
  email_sent: "Email Sent",
  email_spammed: "Email Marked as Spam",
  email_unsubscribed: "Unsubscribed"
};

class MappingUtil {
  /**
   * Gets or sets the service identifier of a Hull user.
   *
   * @type {string}
   * @memberof MappingUtil
   */
  userAttributeServiceId: string;

  /**
   * Gets or sets the mapped user attributes.
   *
   * @type {Array<string>}
   * @memberof MappingUtil
   */
  userAttributeMappings: Array<string>;

  constructor(options: IMappingUtilOptions) {
    this.userAttributeServiceId = _.get(
      options,
      "userAttributeServiceId",
      "external_id"
    );
    this.userAttributeMappings = _.get(options, "userAttributeMappings", []);
  }

  createAttributeName(traitName: string): string {
    if (traitName === "id") {
      return "hull_id";
    }
    if (_.startsWith(traitName, "traits_")) {
      return traitName
        .substr(7)
        .split("/")
        .join("-");
    }

    return traitName.split("/").join("-");
  }

  /**
   * Maps the hull user to a customer for the customer.io API.
   *
   * @param {THullUser} user The user object of Hull.
   * @param {Array<THullSegment>} segments The segments the user
   * @returns {TCustomerIoCustomer} The customer object to use with the customer.io API.
   * @memberof MappingUtil
   */
  mapToServiceUser(
    user: HullUser,
    segments: Array<HullSegment>
  ): TCustomerIoCustomer {
    // Default required/recommended attributes
    let serviceObj: TCustomerIoCustomer = {
      id: _.get(user, this.userAttributeServiceId, null),
      email: _.get(user, "email", null),
      created_at: moment(_.get(user, "created_at")).unix()
    };
    // Always sync the segments
    _.set(serviceObj, "hull_segments", _.map(segments, s => s.name));

    // Map the custom attributes
    const filteredAttributes = _.pick(user, this.userAttributeMappings);

    // Un-nest the account
    if (filteredAttributes.account) {
      _.forIn(filteredAttributes.account, (val, key) => {
        _.set(filteredAttributes, `account_${key}`, val);
      });
      _.unset(filteredAttributes, "account");
    }

    const customAttributes = _.mapKeys(filteredAttributes, (val, key) => {
      return this.createAttributeName(key);
    });
    serviceObj = _.merge(serviceObj, customAttributes);

    serviceObj = _.mapValues(serviceObj, (value, key) => {
      if (
        key !== "created_at" &&
        (_.endsWith(key, "_date") || _.endsWith(key, "_at")) &&
        moment(value).isValid()
      ) {
        return moment(value).format("X");
      }
      return value;
    });

    return serviceObj;
  }

  /**
   * Maps a hull event to an event for the customer.io API.
   *
   * @param {THullEvent} event The event object of Hull.
   * @returns {ICustomerIoEvent} The event object to use with the customer.io API.
   * @memberof MappingUtil
   */
  mapToServiceEvent(event: HullEvent): ICustomerIoEvent {
    const { context, properties } = event;
    const serviceEvent = {
      name: event.event,
      data: _.get(event, "properties")
    };

    if (event.event === "page") {
      const eventName = properties.url || context.page_url || event.event;
      const referrerUrl = properties.referrer || context.referrer_url;

      _.set(serviceEvent, "name", eventName);
      if (!_.isNil(referrerUrl)) {
        _.set(serviceEvent, "data.referrer", referrerUrl);
      }
      _.set(serviceEvent, "type", "page");
    }

    return serviceEvent;
  }

  /**
   * Maps the customer object to hull attributes.
   *
   * @param {TCustomerIoCustomer} customer The customer object.
   * @param {Date} updatedAt The timestamp when the sync happened.
   * @returns {Object} The traits object.
   * @memberof MappingUtil
   */
  mapToHullTraits(customer: TCustomerIoCustomer, updatedAt: Date): Object {
    const hashUtil = new HashUtil();

    const hash = hashUtil.hash(customer);
    return {
      "customerio/id": _.get(customer, "id", null),
      "customerio/created_at": _.get(customer, "created_at", null),
      "customerio/hash": hash,
      "customerio/synced_at": updatedAt,
      "customerio/deleted_at": null
    };
  }

  /**
   * Maps the webhook payload to a hull ident object.
   *
   * @param {Object} payload The webhook payload.
   * @returns {Object} The ident object.
   * @memberof MappingUtil
   */
  mapWebhookToUserIdent(payload: Object): HullUserClaims {
    const identObj = {};
    // Handle email
    const regex = /[A-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[A-Z0-9.-]+/gim;
    const rawEmail = _.get(payload, "data.email_address", null);
    const parsedEmails = _.isNil(rawEmail) ? [] : rawEmail.match(regex);
    if (parsedEmails && parsedEmails.length > 0) {
      _.set(identObj, "email", parsedEmails[0]);
    }

    // Handle external_id as customer_id
    if (this.userAttributeServiceId === "external_id") {
      _.set(identObj, "external_id", _.get(payload, "data.customer_id"));
    }

    // Handle id as customer_id
    if (this.userAttributeServiceId === "id") {
      _.set(identObj, "id", _.get(payload, "data.customer_id"));
    }

    return identObj;
  }

  /**
   * Maps the webhook payload to a hull event object.
   *
   * @param {Object} payload The webhook payload.
   * @returns {THullEvent} The event object or null if it cannot be mapped.
   * @memberof MappingUtil
   */
  mapWebhookToHullEvent(payload: Object): HullEvent | null {
    if (_.get(payload, "data", null) === null) {
      return null;
    }
    let eventPropPaths;
    let eventNamePath;
    if (_.has(payload, "event_type")) {
      // Handle properties
      eventPropPaths = [
        "email_address",
        "email_id",
        "customer_id",
        "campaign_id",
        "campaign_name",
        "template_id",
        "tags",
        "subject"
      ];
      eventNamePath = _.get(payload, "event_type");
    } else if (_.has(payload, "object_type") && _.has(payload, "metric")) {
      // Handle properties
      eventPropPaths = [
        "email_address",
        "customer_id",
        "campaign_id",
        "content_id",
        "delivery_id",
        "subject"
      ];
      eventNamePath = `${_.get(payload, "object_type")}_${_.get(payload, "metric")}`;
    } else {
      return null;
    }
    const eventProps = _.pick(payload.data, eventPropPaths);
    _.set(eventProps, "email_subject", _.get(eventProps, "subject"));
    _.unset(eventProps, "subject");

    // Handle context
    const context = {
      ip: "0"
    };

    // Hanlde the name
    const eventName = _.get(EVENTTYPE_MAPPINGS, eventNamePath, "n/a");

    if (eventName === "n/a") {
      return null;
    }
    const hullEvent: HullEvent = {
      event_id: _.get(payload, "event_id"),
      event: eventName,
      created_at: _.get(payload, "timestamp"),
      context,
      properties: eventProps
    };

    return hullEvent;
  }
}

module.exports = MappingUtil;
