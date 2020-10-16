// @flow
import type { HullConnector, HullContext, HullUserUpdateMessage } from "hull";

import type {
  HullAccountSegment,
  HullUserSegment
} from "hull-client/src/types";
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

  hullEntityInSegment(
    entitySegments: Array<HullUserSegment | HullAccountSegment>,
    segmentInclusionList: Array<string>
  ): boolean {
    return (
      _.intersection(
        segmentInclusionList,
        entitySegments.map(s => s.id)
      ).length > 0
    );
  }

  isUserWhitelisted(envelope: HubspotUserUpdateMessageEnvelope): boolean {
    const segmentIds =
      (this.connector.private_settings &&
        (this.connector.private_settings.synchronized_user_segments ||
          this.connector.private_settings.synchronized_segments)) ||
      [];
    if (Array.isArray(envelope.message.segments)) {
      return this.hullEntityInSegment(envelope.message.segments, segmentIds);
    }
    return false;
  }

  isAccountWhitelisted(envelope: HubspotAccountUpdateMessageEnvelope): boolean {
    const segmentIds =
      (this.connector.private_settings &&
        this.connector.private_settings.synchronized_account_segments) ||
      [];
    if (Array.isArray(envelope.message.account_segments)) {
      return this.hullEntityInSegment(
        envelope.message.account_segments,
        segmentIds
      );
    }
    return false;
  }

  filterVisitorMessages(messages: Array<HullUserUpdateMessage>) {
    if (this.isBatch) {
      return messages;
    }
    return _.filter(messages, message => {
      const { segments = [] } = message;

      const segmentsInclusionList = this.connector.private_settings
        .synchronized_visitor_segments;

      return this.hullEntityInSegment(segments, segmentsInclusionList);
    });
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

      if (envelope.message.account["hubspot/id"]) {
        return filterUtilResults.toUpdate.push(envelope);
      }

      if (_.isNil(envelope.message.account.domain)) {
        envelope.skipReasonLog = "Account doesn't have value for domain";
        return filterUtilResults.toSkip.push(envelope);
      }

      return filterUtilResults.toInsert.push(envelope);
    });
    return filterUtilResults;
  }
}

module.exports = FilterUtil;
