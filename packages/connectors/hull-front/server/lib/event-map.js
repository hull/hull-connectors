// @flow
import type {
  HullUserEventProperties,
  HullUserEventContext,
  HullUserClaims
} from "hull";

import moment from "moment";
import _ from "lodash";
import type { Event, EventPreview } from "../types";

const LABELS = {
  // "archive": "Conversation Archived",
  // "reopen": "Conversation Unarchived",
  // "trash": "Conversation Deleted",
  // "restore": "Conversation Restored",
  // "comment": "Conversation Commented",
  // "mention": "",
  inbound: "Inbound Message",
  outbound: "Outbound Message",
  out_reply: "Outbound Reply",
  // "move": "",
  // "forward": "Message Forwarded",
  reminder: "Reminder Activated",
  assign: "Conversation Assigned",
  unassign: "Conversation Unassigned",
  tag: "Conversation tagged",
  untag: "Conversation untagged",
  sending_error: "Message delivery failed"
  // "conversations_merged": "",
};

export const getEventName = (event: EventPreview): void | string =>
  _.get(LABELS, event.type);
export const getClaims = (event: Event): void | HullUserClaims => {
  const email = _.get(event, "conversation.recipient.handle");
  // exclude non-emails and twitter handles
  if (!email || email.indexOf("@") < 1) return undefined;
  return { email };
};

export const getEventData = ({
  type,
  conversation,
  target
}: Event): HullUserEventProperties => ({
  event_type: type,
  tags: _.map(conversation.tags, "name"),
  ..._.mapKeys(
    _.pick(conversation.assignee, ["email", "id"]),
    (v, k) => `assignee_${k}`
  ),
  ..._.pick(conversation, ["subject", "status", "id"])
});

export const getEventContext = ({
  emitted_at,
  id
}: Event): HullUserEventContext => ({
  event_id: id,
  created_at: moment.unix(emitted_at),
  source: "front",
  type: "email",
  referer: null,
  ip: 0
});
