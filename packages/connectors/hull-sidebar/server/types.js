// @flow
export type EventType =
  | "number.created"
  | "number.opened"
  | "number.closed"
  | "number.deleted"
  | "call.created"
  | "call.answered"
  | "call.hungup"
  | "call.ended"
  | "call.assigned"
  | "call.archived"
  | "call.tagged"
  | "call.commented"
  | "call.transferred"
  | "call.ringing_on_agent"
  | "call.agent_declined"
  | "call.voicemail_left"
  | "user.created"
  | "user.opened"
  | "user.closed"
  | "user.deleted"
  | "user.connected"
  | "user.disconnected"
  | "contact.created"
  | "contact.updated"
  | "contact.deleted";

export type Source = "teammate" | "rule";
export type Resource = "number" | "user" | "contact" | "call";
export type Tag = {
  name: string,
  tagged_by: User,
  tagged_at: number
};
export type Number = {
  id: number,
  direct_link: string,
  name: string,
  digits: string,
  country: string,
  time_zone: string,
  open: true,
  is_ivr: false,
  live_recording_activated: true,
  users: Array<User>,
  created_at: string
};
export type Comment = {
  id: number,
  content: string,
  posted_by: User,
  posted_at: number
};

export type User = {
  id: number,
  direct_link: string,
  name: string,
  email: string,
  available: boolean,
  numbers: Array<Number>,
  created_at: string
};

export type Email = {
  id?: number,
  label: string,
  value: string
};
export type PhoneNumber = {
  id?: number,
  label: string,
  value: string
};

export type Contact = {
  id: number,
  direct_link: string,
  first_name: string,
  last_name: string,
  company_name: string,
  information: string,
  is_shared: string,
  phone_numbers: Array<PhoneNumber>,
  emails: Array<Email>
};

export type Call = {
  id: number,
  direct_link: string,
  status: "initial" | "answered" | "done",
  direction: "inbound" | "outbound",
  started_at: number,
  answered_at: number,
  ended_at: number,
  duration: number,
  raw_digits: string,
  voicemail: string,
  recording?: string,
  asset?: string,
  archived: boolean,
  missed_call_reason?:
    | "out_of_opening_hours"
    | "short_abandoned"
    | "abandoned_in_ivr"
    | "no_available_agent"
    | "agents_did_not_answer",
  cost: number,
  user: User,
  assigned_to: User,
  contact: Contact,
  comments: Array<Comment>,
  tags: Array<Tag>
};

export type CallEvent = {
  resource: "call",
  event: EventType,
  timestamp: number,
  token: string,
  data: Call
};
export type ContactEvent = {
  resource: "contact",
  event: EventType,
  timestamp: number,
  token: string,
  data: Contact
};
export type NumberEvent = {
  resource: "number",
  event: EventType,
  timestamp: number,
  token: string,
  data: Number
};
export type UserEvent = {
  resource: "user",
  event: EventType,
  timestamp: number,
  token: string,
  data: User
};

export type Event = CallEvent | ContactEvent | NumberEvent | UserEvent;
