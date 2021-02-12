/* @flow */

import type { HullContext, HullUserUpdateMessage } from "hull";
import _ from "lodash";
import validate from "@segment/loosely-validate-event";
import MadkuduError from "./madkudu-error";
import formatBody from "./format-body";
import type { UserEvent, UserIdentify, AccountGroup } from "./types";

export const getUserPayloads = (
  ctx: HullContext,
  message: HullUserUpdateMessage
): Array<UserEvent | UserIdentify | AccountGroup> => {
  const { helpers, client, connector } = ctx;
  const {
    synchronized_user_attributes,
    synchronized_account_attributes,
    synchronized_user_events
  } = connector.private_settings;
  const { getFirstAnonymousId } = client.utils.claims;
  const { user, account, events = [] } = message;
  const { mapAttributes } = helpers;
  const calls = [];

  calls.push(
    formatBody("identify", {
      userId: user.external_id,
      anonymousId: getFirstAnonymousId(user),
      traits: mapAttributes({
        payload: message,
        mapping: synchronized_user_attributes,
        direction: "outgoing"
      })
    })
  );

  events
    .filter(
      ({ event }) =>
        synchronized_user_events.includes("ALL") ||
        synchronized_user_events.includes(event)
    )
    .map(event => {
      const type =
        event.event === "screen" || event.event === "page"
          ? event.event
          : "track";
      return calls.push(
        formatBody(type, {
          type,
          userId: user.external_id,
          anonymousId: getFirstAnonymousId(user),
          event: event.event,
          ..._.pick(event, "event", "properties")
        })
      );
    });

  const groupCall = {
    groupId: account.external_id,
    userId: user.external_id,
    traits: mapAttributes({
      payload: message,
      mapping: synchronized_account_attributes,
      direction: "outgoing"
    })
  };
  if (groupCall.groupId && groupCall.user_id) {
    calls.push(formatBody("group", groupCall));
  }
  // Strip empty/null value for calls and validate bodies
  return _.map(_.compact(calls), body => {
    try {
      validate(body);
    } catch (err) {
      throw new MadkuduError(
        body.type,
        err,
        _.get(
          err,
          "message",
          "Unknown Validation error, see InnerException for more details."
        )
      );
    }
    return body;
  });
};

export const getAccountPayloads = (_ctx: HullContext) => (
  message: HullAccountUpdateMessage
): Array<UserEvent | UserIdentify | AccountGroup> => {
  return message.account;
};
