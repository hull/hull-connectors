/* @flow */
import type {
  THullAccount, THullEvent, THullAccountIdent, THullUserIdent,
  THullAccountAttributes, THullUser, TMadkuduCompany, TMadkuduCompanyProfile
} from "hull";
import type {
  TMadkuduAnalyticsEvent, TMadkuduAnalyticsGroup, TMadkuduAnalyticsIdentify,
  IClearbitMappings, TMadkuduAnalyticsEventType
} from "../types";

const _ = require("lodash");

const PROPS_OMITTED = ["external_id", "anonymous_ids", "id"];
const PROPS_INCLUDED = [
  "created_at",
  "email",
  "first_name",
  "first_seen_at",
  "first_session_initial_referrer",
  "first_session_initial_url",
  "first_session_initial_utm_campaign",
  "first_session_initial_utm_content",
  "first_session_initial_utm_medium",
  "first_session_initial_utm_source",
  "first_session_initial_utm_term",
  "first_session_platform_id",
  "first_session_started_at",
  "invited_by_id",
  "last_known_ip",
  "last_name",
  "last_seen_at",
  "latest_session_initial_referrer",
  "latest_session_initial_url",
  "latest_session_initial_utm_campaign",
  "latest_session_initial_utm_content",
  "latest_session_initial_utm_medium",
  "latest_session_initial_utm_source",
  "latest_session_initial_utm_term",
  "latest_session_platform_id",
  "latest_session_started_at",
  "name",
  "phone",
  "picture",
  "sessions_count",
  "signup_session_initial_referrer",
  "signup_session_initial_url",
  "signup_session_initial_utm_campaign",
  "signup_session_initial_utm_content",
  "signup_session_initial_utm_medium",
  "signup_session_initial_utm_source",
  "signup_session_initial_utm_term",
  "signup_session_platform_id",
  "signup_session_started_at",
  "username"
];

const getUserTraits: any = user => {
  return _.reduce(user, (m, v, k) => {
    if (k.indexOf("traits_") === 0) m[k.replace(/traits_/, "")] = v;
    if (_.includes(PROPS_INCLUDED, k)) m[k] = v;
    return m;
  }, {});
};

class MappingUtil {
  /**
   * Gets or sets the account company mappings for Madkudu payloads.
   *
   * @type {*}
   * @memberof MappingUtil
   */
  clearbitCompanyMapping: Object;

  constructor(clearbitMappings: IClearbitMappings) {
    this.clearbitCompanyMapping = clearbitMappings.company;
  }

  /**
   * Maps the input to a segment identify call.
   *
   * @param {THullUser} user The hull user.
   * @returns {TSegmentPayloadCommon} The segment payload.
   * @memberof MappingUtil
   */
  mapToIdentify(user: THullUser): TMadkuduAnalyticsIdentify {
    return {
      userId: _.get(user, "external_id", null),
      anonymousId: _.get(user, "anonymous_ids.0", null),
      traits: getUserTraits(user)
    };
  }

  /**
   * Maps the input to a segment group call.
   *
   * @param {*} user The hull user.
   * @param {THullAccount} account The hull account.
   * @returns {*} The segment payload or null if the `external_id` for user and/or account is missing.
   * @memberof MappingUtil
   */
  mapToGroup(user: THullUser, account: THullAccount): TMadkuduAnalyticsGroup | null {
    if (_.isNil(_.get(account, "external_id", null)) ||
        _.isNil(_.get(user, "external_id", null))) {
      return null;
    }

    return {
      groupId: _.get(account, "external_id"),
      userId: _.get(user, "external_id"),
      traits: _.omit(account, PROPS_OMITTED)
    };
  }

  /**
   * Maps the input to a segment user event.
   *
   * @param {TSegmentUserEvent} type The type of event.
   * @param {*} user The hull user.
   * @param {*} event The hull event.
   * @returns {*} The segment payload.
   * @memberof MappingUtil
   */
  mapToEvent(eventType: TMadkuduAnalyticsEventType, user: THullUser, event: THullEvent): TMadkuduAnalyticsEvent {
    return {
      type: eventType,
      userId: _.get(user, "external_id", null),
      anonymousId: _.get(user, "anonymous_ids.0", null),
      ..._.pick(event, "event", "properties")
    };
  }

  /**
   * Maps the hull account to the appropriate Madkudu payload.
   *
   * @param {THullAccount} account The hull account object.
   * @returns {TMadkuduCompany} The payload for the Madkudu companies API endpoint.
   * @memberof MappingUtil
   */
  mapToMadkuduCompany(account: THullAccount): TMadkuduCompany {
    const company: THullAccountAttributes = _.get(account, "clearbit", {});
    const domain: string = _.get(account, "domain", _.get(company, "domain", null));

    const payload: TMadkuduCompany = {};

    if (domain) {
      payload.domain = domain;
    }

    if (_.size(company)) {
      payload.company = _.reduce(
        this.clearbitCompanyMapping,
        (m, v, k) => {
          if (!_.isNil(_.get(company, k, null))) {
            _.set(m, v, _.get(company, k));
          }
          return m;
        },
        {}
      );
    }
    return payload;
  }

  /**
   * Maps the response from Madkudu into hull account traits.
   *
   * @param {*} response The response from the Madkudu API `/companies` endpoint.
   * @returns {*} The account traits object
   * @memberof MappingUtil
   */
  mapMadkuduCompanyToTraits(profile: TMadkuduCompanyProfile): ?THullAccountAttributes {
    if (_.get(profile, "properties", null) === null) return null;
    if (profile.object_type !== "company") return null;
    const { customer_fit = {}, number_of_employees, name } = profile.properties;
    const { segment, top_signals = [] } = customer_fit;
    const signals = _.groupBy(top_signals, "type");
    const traits = _.reduce(
      signals,
      (m, signal, type) => {
        m[`top_signals_${type}`] = _.map(signal, "name");
        return m;
      },
      {
        fetched_at: new Date().toISOString(),
        number_of_employees,
        name,
        customer_fit_segment: segment
      }
    );
    top_signals.map(s => {
      traits[`signal_${_.snakeCase(s.name)}`] = s.value;
      return true;
    });
    _.unset(traits, "signal_firmographics_profile");
    return traits;
  }

  /**
   * Extracts the identifiers from the account object.
   *
   * @param {THullAccount} account The hull account object.
   * @returns {THullAccountIdent} The identifiers of the account.
   * @memberof MappingUtil
   */
  extractAccountIdentifier(account: THullAccount): THullAccountIdent {
    const ident: THullAccountIdent = _.pick(account, ["id", "external_id", "domain"]);
    return ident;
  }

  /**
   * Extracts the identifiers from the account object.
   *
   * @param {THullAccount} account The hull account object.
   * @returns {THullAccountIdent} The identifiers of the account.
   * @memberof MappingUtil
   */
  extractUserIdentifier(user: THullUser): THullUserIdent {
    const ident: THullUserIdent = _.pick(user, ["id", "external_id", "email"]);
    return ident;
  }
}

module.exports = MappingUtil;
