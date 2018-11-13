// @flow
import type { HullConnector, HullContext, HullAccountClaims } from "hull";
import type {
  FilterUtilResults,
  HubspotUserUpdateMessageEnvelope,
  HubspotAccountUpdateMessageEnvelope
} from "../../types";

const debug = require("debug")("hull-hubspot:filter-util");
const _ = require("lodash");

class FilterUtil {
  connector: HullConnector;

  isBatch: boolean;

  incomingAccountIdentHull: string;

  incomingAccountIdentService: string;

  constructor(ctx: HullContext) {
    this.connector = ctx.connector;
    this.isBatch = ctx.isBatch;
    this.incomingAccountIdentHull = this.connector.private_settings.incoming_account_ident_hull;
    this.incomingAccountIdentService = this.connector.private_settings.incoming_account_ident_service;

    debug("isBatch", this.isBatch);
  }

  isUserWhitelisted(envelope: HubspotUserUpdateMessageEnvelope): boolean {
    const segmentIds =
      (this.connector.private_settings &&
        this.connector.private_settings.synchronized_segments) ||
      [];
    if (Array.isArray(envelope.message.segments)) {
      return (
        _.intersection(segmentIds, envelope.message.segments.map(s => s.id))
          .length > 0
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
    const filterUtilResults: FilterUtilResults<
      HubspotUserUpdateMessageEnvelope
    > = {
      toInsert: [],
      toUpdate: [],
      toSkip: []
    };
    envelopes.forEach(envelope => {
      const { user, changes = {} } = envelope.message;
      if (
        _.get(changes, "user['traits_hubspot/fetched_at'][1]", false) &&
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
    const filterUtilResults: FilterUtilResults<
      HubspotAccountUpdateMessageEnvelope
    > = {
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

      if (
        typeof envelope.message.account.domain !== "string" ||
        envelope.message.account.domain.trim() === ""
      ) {
        envelope.skipReason = "Account doesn't have value for domain";
        return filterUtilResults.toSkip.push(envelope);
      }

      return filterUtilResults.toInsert.push(envelope);
    });
    return filterUtilResults;
  }

  filterIncomingAccountIdent(accountIdent: HullAccountClaims): true | string {
    const valueToTest =
      accountIdent && accountIdent[this.incomingAccountIdentHull];
    if (
      valueToTest !== undefined &&
      valueToTest !== null &&
      valueToTest.trim() !== ""
    ) {
      return true;
    }
    return `The Hubspot company does not have a ${
      this.incomingAccountIdentService
    } defined. Please define a ${
      this.incomingAccountIdentService
    } in Hubspot for this company in order for it to be imported"`;
  }
}

module.exports = FilterUtil;
