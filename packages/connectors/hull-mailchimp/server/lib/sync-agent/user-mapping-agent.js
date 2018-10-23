/* @flow */

import type {
  HullUser,
  HullUserUpdateMessage,
  HullUserAttributes,
  HullUserClaims,
  HullAttributeValue
} from "hull";
import type { TMailchimpWebhookPayload, TMailchimpMergeFields } from "../types";

const _ = require("lodash");
const flatten = require("flat");

const MailchimpFields = [
  "email_client",
  "language",
  "last_changed",
  "location.country_code",
  "location.latitude",
  "location.longitude",
  "location.timezone",
  "member_rating",
  "stats.avg_click_rate",
  "stats.avg_open_rate",
  "status",
  "subscribed",
  "unique_email_id",
  "vip"
];

/**
 * Agent managing Mailchimp static segments aka audiences
 * and mapping stored in ships private settings
 * TODO: integrate with SyncAgent
 */
class UserMappingAgent {
  ship: Object;

  client: Object;

  metric: Object;

  mailchimpFields: Array<string>;

  constructor(ship: Object, client: Object, metric: Object) {
    this.ship = ship;
    this.client = client;
    this.metric = metric;
    this.mailchimpFields = MailchimpFields;
  }

  getExtractFields(): Array<string> {
    const traits = this.mailchimpFields.map(path => {
      const trait = _.last(path.split("."));
      return `traits_mailchimp/${trait}`;
    });
    const props = [
      "traits_mailchimp/import_error",
      "traits_mailchimp/last_activity_at",
      "id",
      "email",
      "first_name",
      "last_name"
    ];
    return props.concat(traits);
  }

  getUserTraitsForMember(member: TMailchimpWebhookPayload): HullUserAttributes {
    const merges = _.omit(
      member.merges || member.merge_fields,
      "GROUPINGS",
      "INTERESTS"
    );
    const email = (member.email_address || member.email || "").toLowerCase();
    // $FlowFixMe
    const unique_email_id = member.unique_email_id || member.id;
    const attrs = _.merge({}, flatten(merges, { delimiter: "_", safe: true }), {
      unique_email_id,
      email
    });

    // $FlowFixMe
    if (member.status) {
      attrs.status = member.status;
    }

    MailchimpFields.map(path => {
      const key = _.last(path.split("."));
      const value = _.get(member, path);
      if (!_.isNil(value)) {
        attrs[key] = value;
      }
      return value;
    });

    const traits = _.reduce(
      attrs,
      (tt, v, k) => {
        return _.merge({}, tt, { [k.toLowerCase()]: v });
      },
      {}
    );

    if (_.isNil(traits.subscribed)) {
      if (traits.status === "subscribed") {
        traits.subscribed = true;
      } else if (traits.status === "unsubscribed") {
        traits.subscribed = false;
      }
    }

    const interestCategoryId = _.get(
      this.ship,
      "private_settings.interest_category_id",
      ""
    );
    const groupings = _.get(member, "merges.GROUPINGS", []);
    const groupsToSave = _.filter(groupings, { unique_id: interestCategoryId });
    _.map(groupsToSave, group => {
      traits[`${_.toLower(group.name).replace(" ", "_")}`] = group.groups
        .split(",")
        .map(_.trim);
    });

    return traits;
  }

  updateUser(member: TMailchimpWebhookPayload): Promise<*> {
    const mailchimp = this.getUserTraitsForMember(member);
    const { email, unique_email_id } = mailchimp;
    const ident: HullUserClaims = { email: _.toString(email) };
    if (unique_email_id) {
      ident.anonymous_id = `mailchimp:${_.toString(unique_email_id)}`;
    }

    const traits = flatten({ mailchimp }, { delimiter: "/", safe: true });

    if (!_.isEmpty(mailchimp.fname)) {
      traits.first_name = { operation: "setIfNull", value: mailchimp.fname };
    }

    if (!_.isEmpty(mailchimp.lname)) {
      traits.last_name = { operation: "setIfNull", value: mailchimp.lname };
    }
    this.metric.increment("ship.incoming.users");
    return this.client
      .asUser(ident)
      .traits(traits)
      .then(
        () => {
          this.client
            .asUser(ident)
            .logger.info("incoming.user.success", { traits });
        },
        error => {
          this.client
            .asUser(ident)
            .logger.info("incoming.user.error", { error });
        }
      );
  }

  /**
   * Get list of attributes which should be synced to Mailchimp.
   *
   * @returns {Array} Array of objects having `name` and `hull` properties
   */
  computeMergeFields() {
    return (
      _.get(this.ship, "private_settings.sync_fields_to_mailchimp") || []
    ).filter(
      f =>
        typeof f.hull === "string" &&
        f.hull !== "" &&
        (typeof f.name === "string" && f.name !== "")
    );
  }

  /**
   * Return only names of Mailchimp fields
   * @returns {Array}
   */
  getMergeFieldsKeys() {
    return this.computeMergeFields().map(f => f.name);
  }

  getMergeFieldValue(
    payload: HullUser,
    {
      name,
      hull,
      overwrite = false
    }: { name: string, hull: string, overwrite: boolean }
  ): HullAttributeValue {
    // since the account is a subobject we need to use lodash get method to traverse it using dot notation path
    if (overwrite === true) {
      return _.get(payload, hull) || "";
    }
    return (
      payload[`traits_mailchimp/${name.toLowerCase()}`] ||
      _.get(payload, hull) ||
      ""
    );
  }

  /**
   * Get ready object of attributes and its values converted from Hull
   * user to Mailchimp list member
   *
   * @returns {Object}
   */
  getMergeFields(
    userUpdateMessage: HullUserUpdateMessage
  ): TMailchimpMergeFields {
    const payload: HullUser = {
      ...userUpdateMessage.user,
      account: userUpdateMessage.account
    };
    return _.reduce(
      this.computeMergeFields(),
      (fields, prop) => {
        const value = this.getMergeFieldValue(payload, prop);
        return { ...fields, [prop.name]: value };
      },
      {}
    );
  }
}

module.exports = UserMappingAgent;
