// @flow
import type { HullConnector, HullContext } from "hull";
import type {
  FilterUtilResults,
  HubspotUserUpdateMessageEnvelope,
  HubspotAccountUpdateMessageEnvelope
} from "../../types";

const _ = require("lodash");

class FilterUtil {
  connector: HullConnector;

  isBatch: boolean;

  constructor(ctx: HullContext) {
    this.connector = ctx.connector;
    this.isBatch = ctx.isBatch;
  }

  isUserWhitelisted(envelope: HubspotUserUpdateMessageEnvelope): boolean {
    const segmentIds =
      (this.connector.private_settings &&
        (this.connector.private_settings.synchronized_user_segments ||
          this.connector.private_settings.synchronized_segments)) ||
      [];
    if (Array.isArray(envelope.message.segments)) {
      return (
        _.intersection(
          segmentIds,
          envelope.message.segments.map(s => s.id)
        ).length > 0
      );
    }
    return false;
  }

  isAccountWhitelisted(envelope: HubspotAccountUpdateMessageEnvelope): boolean {
    const segmentIds =
      (this.connector.private_settings &&
        this.connector.private_settings.synchronized_account_segments) ||
      [];
    if (Array.isArray(envelope.message.account_segments)) {
      return (
        _.intersection(
          segmentIds,
          envelope.message.account_segments.map(s => s.id)
        ).length > 0
      );
    }
    return false;
  }

  filterUserUpdateMessageEnvelopes(
    envelopes: Array<HubspotUserUpdateMessageEnvelope>
  ): FilterUtilResults<HubspotUserUpdateMessageEnvelope> {
    const filterUtilResults: FilterUtilResults<HubspotUserUpdateMessageEnvelope> = {
      toInsert: [],
      toUpdate: [],
      toSkip: []
    };
    envelopes.forEach(envelope => {
      const { user, changes = {} } = envelope.message;

      // TODO need to be careful with this logic.  If multiple changes came in at the same time
      // could be blocking good changes from going...
      if (
        _.get(changes, "user['hubspot/fetched_at'][1]", false) &&
        _.isEmpty(_.get(changes, "segments"))
      ) {
        envelope.skipReason = "User just touched by hubspot connector";
        return filterUtilResults.toSkip.push(envelope);
      }

      if (
        !this.isBatch &&
        (!this.isUserWhitelisted(envelope) || _.isEmpty(user.email))
      ) {
        envelope.skipReason = "User doesn't match outgoing filter";
        return filterUtilResults.toSkip.push(envelope);
      }
      return filterUtilResults.toInsert.push(envelope);
    });
    return filterUtilResults;
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

  filterAccountUpdateMessageEnvelopes(
    envelopes: Array<HubspotAccountUpdateMessageEnvelope>
  ): FilterUtilResults<HubspotAccountUpdateMessageEnvelope> {
    const filterUtilResults: FilterUtilResults<HubspotAccountUpdateMessageEnvelope> = {
      toInsert: [],
      toUpdate: [],
      toSkip: []
    };
    envelopes.forEach(envelope => {
      const { changes = {} } = envelope.message;
      if (
        _.get(changes, "account['hubspot/fetched_at'][1]", false) &&
        _.isEmpty(_.get(changes, "segments"))
      ) {
        envelope.skipReason = "Account just touched by hubspot connector";
        return filterUtilResults.toSkip.push(envelope);
      }
      if (!this.isBatch && !this.isAccountWhitelisted(envelope)) {
        envelope.skipReason = "Account doesn't match outgoing filter";
        return filterUtilResults.toSkip.push(envelope);
      }

      const hubspotIdMapping = this.getHubspotIdMapping("account");
      const { hull = "hubspot/id" } = hubspotIdMapping || {};
      if (envelope.message.account[hull]) {
        return filterUtilResults.toUpdate.push(envelope);
      }

      if (_.isNil(envelope.message.account.domain)) {
        envelope.skipReason = "Account doesn't have value for domain";
        return filterUtilResults.toSkip.push(envelope);
      }

      return filterUtilResults.toInsert.push(envelope);
    });
    return filterUtilResults;
  }
}

module.exports = FilterUtil;
