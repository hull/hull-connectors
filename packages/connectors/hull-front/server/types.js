// @flow
export type EventType =
  | "assign"
  | "unassign"
  | "archive"
  | "reopen"
  | "trash"
  | "restore"
  | "comment"
  | "mention"
  | "inbound"
  | "outbound"
  | "move"
  | "forward"
  | "tag"
  | "untag"
  | "sending_error"
  | "reminder"
  | "out_reply"
  | "conversations_merged";

export type SourceType = "teammate" | "rule";
export type Target =
  | "teammate"
  | "comment"
  | "message"
  | "inboxes"
  | "tag"
  | "deleted_conversation_ids";
export type Recipient = {
  _links: {
    related: {
      contact: string
    }
  },
  handle: string,
  role: "to"
};
export type Tag = {
  _links: {
    self: string,
    related: {
      conversations: string,
      owner: string,
      children: string
    }
  },
  id: string,
  name: string,
  highlight: string,
  is_private: boolean,
  created_at: number,
  updated_at: number
};
export type Teammate = {
  _links: {
    self: string,
    related: {
      inboxes: string,
      conversations: string
    }
  },
  id: string,
  email: string,
  username: string,
  first_name: string,
  last_name: string,
  is_admin: boolean,
  is_available: boolean,
  is_blocked: boolean
};
export type Conversation = {
  _links: {
    self: string,
    related: {
      events: string,
      followers: string,
      messages: string,
      comments: string,
      inboxes: string
    }
  },
  recipient: Recipient,
  tags: Array<Tag>,
  assignee: Teammate,
  subject: string,
  status: string,
  id: string
};
export type Message = {
  _links: {
    self: string,
    related: {
      conversation: string,
      message_replied_to: string
    }
  },
  id: string,
  type: "email",
  is_inbound: true,
  is_draft: false,
  created_at: number,
  blurb: string,
  author: Teammate | Recipient,
  recipients: Array<Recipient>,
  body: string,
  text: string,
  attachments: Array<any>,
  metadata: {}
};
export type Source = {
  _meta: { type: SourceType },
  _links: { self: string },
  id: string,
  data?: {}
};
export type EventPreview = {
  _links: { self: string },
  id: string,
  type: EventType,
  emitted_at: number,
  source: Source,
  target: Teammate | Comment | Message | Tag,
  conversation: {
    _links: {
      self: string,
      related: {
        events: string,
        followers: string,
        messages: string,
        comments: string,
        inboxes: string
      }
    },
    id: string
  }
};
export type Event = {
  _links: { self: string },
  id: string,
  type: EventType,
  emitted_at: number,
  source: {
    _meta: { type: Source },
    _links: { self: string },
    id: string,
    data: {}
  },
  target: {
    _meta: { type: Target },
    _links: { self: string },
    id: string
  },
  conversation: Conversation
};
