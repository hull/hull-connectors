/* @flow */
import type { THullUserUpdateMessage, THullAccountUpdateMessage } from "hull";
import type {
  FilterResults,
  OutreachConnectorSettings,
  OutreachAccountUpdateEnvelope,
  OutreachProspectUpdateEnvelope
} from "../types";

const _ = require("lodash");

const SHARED_MESSAGES = require("../shared-messages");

class FilterUtil {
  /**
   * Gets or sets the segments that we're supposed to deal with
   *
   * @type {Array<string>}
   * @memberof FilterUtil
   */
  settings: OutreachConnectorSettings;

  /**
   *Creates an instance of FilterUtil.
   * @param {OutreachConnectorSettings} config The settings to configure the util with.
   * @memberof FilterUtil
   */
  constructor(settings: OutreachConnectorSettings) {
    this.settings = settings;
  }

  /**
   * Filters the list of user envelopes to determine the operation.
   *
   * @param {Array<UserUpdateEnvelope>} envelopes The list of envelopes to filter.
   * @returns {FilterResults<UserUpdateEnvelope>} The filter result.
   * @memberof FilterUtil
   */
  filterUsers(
    envelopes: Array<OutreachProspectUpdateEnvelope>
  ): FilterResults<OutreachProspectUpdateEnvelope> {
    const results: FilterResults<OutreachProspectUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: []
    };

    envelopes.forEach((envelope: OutreachProspectUpdateEnvelope) => {
      // Filter users not linked to accounts that match whitelisted segments
      // TODO ask sven about segment logic again...
      if (
        !this.matchesSegments(
          envelope.hullUser.segment_ids,
          this.settings.synchronized_user_segments
        )
      ) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOMATCHUSERSEGMENTS();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Determine which contacts to update or create
      if (_.has(envelope.hullUser, "outreach/id")) {
        envelope.outreachProspectId = envelope.hullUser["outreach/id"];
        return results.toUpdate.push(envelope);
      }

      if (_.isEmpty(envelope.outreachProspectWrite.data.attributes.emails)) {
        envelope.outreachProspectWrite.data.attributes.emails = [
          envelope.hullUser.email
        ];
      }

      return results.toInsert.push(envelope);
    });
    return results;
  }

  /**
   * Filters the list of account envelopes to determine the appropriate operation.
   *
   * @param {Array<AccountUpdateEnvelope>} envelopes The list of envelopes to filter.
   * @returns {FilterResults<AccountUpdateEnvelope>} The filter result.
   * @memberof FilterUtil
   */
  filterAccounts(
    envelopes: Array<OutreachAccountUpdateEnvelope>
  ): FilterResults<OutreachAccountUpdateEnvelope> {
    const accountIdentifierHull = this.settings.account_identifier_hull;

    const results: FilterResults<OutreachAccountUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: []
    };

    envelopes.forEach((envelope: OutreachAccountUpdateEnvelope) => {
      // Filter out all accounts that have no identifier in Hull
      if (_.isNil(envelope.hullAccount[accountIdentifierHull])) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOACCOUNTIDENT(
          accountIdentifierHull
        );
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Filter out all accounts that do not match the whitelisted account segments
      // TODO ask sven about segment logic again...
      // TODO also make sure we're looking in the right place for account segment ids
      // close io seemed to be checking the messages level which concatenates all segments from inner user updates together...
      if (
        !this.matchesSegments(
          envelope.hullAccount.segment_ids,
          this.settings.synchronized_account_segments
        )
      ) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Determine which accounts to insert and which ones to update
      if (_.has(envelope.hullAccount, "outreach/id")) {
        envelope.outreachAccountId = envelope.hullAccount["outreach/id"];
        return results.toUpdate.push(envelope);
      }

      return results.toInsert.push(envelope);
    });
    return results;
  }

  /**
   * Checks whether an envelope matches the synchronized account segments or not.
   *
   * @param {(OutreachProspectUpdateEnvelope | OutreachAccountUpdateEnvelope)} envelope The user or account envelope to check.
   * @param {string} segmentPropertyName The name of the segments property of the message.
   * @returns {boolean} True if the envelope matches; otherwise false.
   * @memberof FilterUtil
   */
  matchesSegments(
    incomingSegments: Array<string>,
    synchronizedSegments: Array<string>
  ): boolean {
    // const msgSegmentIds: Array<string> = _.get(
    //   envelope,
    //   segmentPropertyName,
    //   []
    // ).map(s => s.id);
    if (_.intersection(incomingSegments, synchronizedSegments).length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Deduplicates messages by user.id and joins all events into a single message.
   *
   * @param {Array<THullUserUpdateMessage>} messages The list of messages to deduplicate.
   * @returns {Array<THullUserUpdateMessage>} A list of unique messages.
   * @memberof FilterUtil
   */
  deduplicateUserUpdateMessages(
    messages: Array<THullUserUpdateMessage>
  ): Array<THullUserUpdateMessage> {
    return _.chain(messages)
      .groupBy("user.id")
      .map(
        (
          groupedMessages: Array<THullUserUpdateMessage>
        ): THullUserUpdateMessage => {
          const dedupedMessage = _.cloneDeep(
            _.last(_.sortBy(groupedMessages, ["user.indexed_at"]))
          );
          const hashedEvents = {};
          groupedMessages.forEach((m: THullUserUpdateMessage) => {
            _.get(m, "events", []).forEach((e: Object) => {
              _.set(hashedEvents, e.event_id, e);
            });
          });
          dedupedMessage.events = _.values(hashedEvents);
          return dedupedMessage;
        }
      )
      .value();
  }

  deduplicateAccountUpdateMessages(
    messages: Array<THullAccountUpdateMessage>
  ): Array<THullAccountUpdateMessage> {
    return _.chain(messages)
      .groupBy("account.id")
      .map(
        (
          groupedMessages: Array<THullUserUpdateMessage>
        ): THullUserUpdateMessage => {
          const dedupedMessage = _.cloneDeep(
            _.last(_.sortBy(groupedMessages, ["account.indexed_at"]))
          );
          return dedupedMessage;
        }
      )
      .value();
  }
}

module.exports = FilterUtil;
