// @flow
import type {
  HullUserEventProperties,
  HullUserEventContext,
  HullUserClaims
} from "hull";
import moment from "moment";
import _ from "lodash";
import type {
  Event,
  Call,
  Contact,
  CallEvent,
  ContactEvent
  // , NumberEvent,
  // UserEvent,
  // Email
} from "../types";

const propsFromCall = ({
  status,
  direction,
  started_at,
  answered_at,
  ended_at,
  duration,
  raw_digits,
  voicemail,
  recording,
  cost,
  user: { id: user_id, email: user_email },
  tags,
  comments
}: Call) => ({
  status,
  direction,
  started_at: moment.unix(started_at).toISOString(),
  answered_at: moment.unix(answered_at).toISOString(),
  ended_at: moment.unix(ended_at).toISOString(),
  duration,
  raw_digits,
  voicemail,
  recording,
  cost,
  user_id,
  user_email,
  tags: tags.map(t => t.name),
  comments: comments.map(c => c.content)
});

const getValues = (field: string) => (contact: Contact): Array<?string> =>
  _.map(contact[field], i => i.value);
const getPhones = getValues("phone_numbers");
const getEmails = getValues("emails");
const getFirstEmail = (contact: Contact) => _.first(getEmails(contact));
const getFirstPhone = (contact: Contact) => _.first(getPhones(contact));

const attrsFromContact = (contact: Contact) => ({
  email: { operation: "setIfNull", value: getFirstPhone(contact) },
  phone: { operation: "setIfNull", value: getFirstEmail(contact) },
  first_name: { operation: "setIfNull", value: contact.first_name },
  last_name: { operation: "setIfNull", value: contact.last_name },
  "aircall/phone_numbers": getPhones(contact),
  "aircall/emails": getEmails(contact),
  ..._.mapKeys(
    _.pick(contact, [
      "id",
      "first_name",
      "last_name",
      "information",
      "company_name"
    ]),
    (v, k) => `aircall/${k}`
  )
});

const PROPERTIES = {
  "call.created": (event: CallEvent) => ({
    ...propsFromCall(event.data)
  }),
  "call.answered": (event: CallEvent) => ({
    ...propsFromCall(event.data)
  }),
  "call.ended": (event: CallEvent) => ({
    ...propsFromCall(event.data)
  }),
  "call.tagged": (event: CallEvent) => ({
    ...propsFromCall(event.data)
  }),
  "call.commented": (event: CallEvent) => ({
    ...propsFromCall(event.data)
  }),
  "call.voicemail_left": (event: CallEvent) => ({
    ...propsFromCall(event.data)
  }),
  "contact.created": (_event: ContactEvent) => ({}),
  "contact.updated": (_event: ContactEvent) => ({}),
  "contact.deleted": (_event: ContactEvent) => ({})
};

const ATTRIBUTES = {
  "call.created": (event: CallEvent) => ({
    ...attrsFromContact(event.data.contact)
  }),
  "call.answered": (event: CallEvent) => ({
    ...attrsFromContact(event.data.contact)
  }),
  "call.ended": (event: CallEvent) => ({
    ...attrsFromContact(event.data.contact)
  }),
  "call.tagged": (event: CallEvent) => ({
    ...attrsFromContact(event.data.contact)
  }),
  "call.commented": (event: CallEvent) => ({
    ...attrsFromContact(event.data.contact)
  }),
  "call.voicemail_left": (event: CallEvent) => ({
    ...attrsFromContact(event.data.contact)
  }),
  "contact.created": (event: ContactEvent) => ({
    ...attrsFromContact(event.data)
  }),
  "contact.updated": (event: ContactEvent) => ({
    ...attrsFromContact(event.data)
  }),
  "contact.deleted": (event: ContactEvent) => ({
    ...attrsFromContact(event.data)
  })
};

const LABELS = {
  // "number.created":
  // "number.opened":
  // "number.closed":
  // "number.deleted":
  "call.created": "Call Created",
  "call.answered": "Call Answered",
  // "call.hungup":
  "call.ended": "Call Ended",
  // "call.assigned":
  // "call.archived":
  "call.tagged": "Call Tagged",
  "call.commented": "Call Commented",
  // "call.transferred": "Call Transferred",
  // "call.ringing_on_agent":
  // "call.agent_declined":
  "call.voicemail_left": "Call Voicemail Left"
  // "user.created":
  // "user.opened":
  // "user.closed":
  // "user.deleted":
  // "user.connected":
  // "user.disconnected":
  // "contact.created": "Contact Created",
  // "contact.updated": "Contact Updated",
  // "contact.deleted": "Call Deleted"
};

export const getEventName = (event: Event): string | void =>
  _.get(LABELS, event.event);

export const getEventData = (event: Event): HullUserEventProperties => {
  const handler = _.get(PROPERTIES, event.event);
  if (!handler) {
    return {};
  }
  return handler(event);
};

const getContact = (resource, event) => {
  if (resource === "call") {
    return event.data.contact;
  }
  if (resource === "contact") {
    return event.data;
  }
  return undefined;
};

export const getClaims = (preferred_email: string) => (
  event: Event
): void | HullUserClaims => {
  const { resource } = event;
  // $FlowFixMe
  const contact: void | Contact = getContact(resource, event);
  if (!contact) {
    return undefined;
  }
  const { emails, id } = contact;
  const email = (
    _.find(emails, e => e.label === preferred_email) ||
    _.first(emails) ||
    {}
  ).value;
  if (email) {
    return { anonymous_id: `aircall-${id}`, email };
  }
  return undefined;
};

export const getAttributes = (event: CallEvent) => {
  const handler = _.get(ATTRIBUTES, event.event);
  if (handler) {
    return handler(event);
  }
  return undefined;
};

export const getEventContext = ({
  timestamp
}: Event): HullUserEventContext => ({
  event_id: `aircall-${timestamp}`,
  created_at: moment.unix(timestamp),
  source: "aircall",
  type: "call",
  referer: null,
  ip: 0
});
