// @flow
import type { TFilterResults, TAccountUpdateEnvelope, TUserUpdateEnvelope, TFilterUtilOptions } from "../types";

const _ = require("lodash");
const SHARED_MESSAGES = require("../shared-messages");

class FilterUtil {
  /**
   * Gets or sets the list of synchronized segments.
   *
   * @type {Array<string>}
   * @memberof FilterUtil
   */
  synchronizedAccountsSegments: Array<string>;

  /**
   * Gets or sets the property name of messages for the account segmetns.
   *
   * @type {string}
   * @memberof FilterUtil
   */
  segmentAccountPropertyName: string;

  /**
   * Gets or sets the list of synchronized segments.
   *
   * @type {Array<string>}
   * @memberof FilterUtil
   */
  synchronizedUsersSegments: Array<string>;

  /**
   * Creates an instance of FilterUtil.
   * @param {TFilterUtilOptions} options The options to configure this utility with.
   * @memberof FilterUtil
   */
  constructor(options: TFilterUtilOptions) {
    this.synchronizedAccountsSegments = options.synchronizedAccountsSegments;
    this.segmentAccountPropertyName = options.segmentAccountPropertyName || "account_segments";
    this.synchronizedUsersSegments = options.synchronizedUsersSegments;
  }

  /**
   * Filters the envelopes and returns the accounts `toInsert` and `toSkip`.
   *
   * @param {Array<TAccountUpdateEnvelope>} envelopes The envelopes to filer.
   * @param {boolean} [isBatch=false] `true` if the envelopes are part of a batch; otherwise `false`. Defaults to `false`.
   * @returns {TFilterResults<TAccountUpdateEnvelope>} The filtered result; this connector uses only `toSkip` and `toInsert`.
   * @memberof FilterUtil
   */
  filterAccountUpdateEnvelopes(envelopes: Array<TAccountUpdateEnvelope>, isBatch: boolean = false): TFilterResults<TAccountUpdateEnvelope> {
    const results: TFilterResults<TAccountUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: [],
      toDelete: []
    };

    envelopes.forEach((envelope: TAccountUpdateEnvelope) => {
      if (!this.matchesAccountsSynchronizedSegments(envelope) && !isBatch) {
        envelope.skipReason = SHARED_MESSAGES.SKIP_ACCOUNT_NOTINSEGMENTS;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      if (_.get(envelope, "message.account.madkudu/fetched_at", null) !== null) {
        envelope.skipReason = SHARED_MESSAGES.SKIP_ACCOUNT_ALREADYENRICHED;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      if (_.keys(_.get(envelope, "company.company", {})).length === 0) {
        envelope.skipReason = SHARED_MESSAGES.SKIP_ACCOUNT_INSUFFICIENTDATA;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      return results.toInsert.push(envelope);
    });

    return results;
  }

  /**
   * Checks whether a message matches the synchronized account segments.
   *
   * @param {TAccountUpdateEnvelope} envelope The envelope.
   * @returns {boolean} True if at least one segments matches; otherwise False.
   * @memberof FilterUtil
   */
  matchesAccountsSynchronizedSegments(envelope: TAccountUpdateEnvelope): boolean {
    const msgSegmentIds: Array<string> = _.get(envelope.message, this.segmentAccountPropertyName, []).map(s => s.id);
    console.log(">>> matchesAccountSynchronizedSegments", msgSegmentIds, this.synchronizedAccountsSegments);
    if (_.intersection(msgSegmentIds, this.synchronizedAccountsSegments).length > 0) {
      return true;
    }
    return false;
  }

  filterUserUpdateEnvelopes(envelopes: Array<TUserUpdateEnvelope>, isBatch: boolean = false): TFilterResults<TUserUpdateEnvelope> {
    const results: TFilterResults<TUserUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: [],
      toDelete: []
    };

    envelopes.forEach((envelope) => {
      if (!this.matchesUsersSynchronizedSegments(envelope) && !isBatch) {
        envelope.skipReason = SHARED_MESSAGES.SKIP_USER_NOTINSEGMENTS;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      return results.toInsert.push(envelope);
    });

    return results;
  }

  /**
   * Checks whether a message matches the synchronized account segments.
   *
   * @param {TAccountUpdateEnvelope} envelope The envelope.
   * @returns {boolean} True if at least one segments matches; otherwise False.
   * @memberof FilterUtil
   */
  matchesUsersSynchronizedSegments(envelope: TUserUpdateEnvelope): boolean {
    const msgSegmentIds: Array<string> = _.get(envelope.message, "segments").map(s => s.id);
    if (_.intersection(msgSegmentIds, this.synchronizedUsersSegments).length > 0) {
      return true;
    }
    return false;
  }
}

module.exports = FilterUtil;
