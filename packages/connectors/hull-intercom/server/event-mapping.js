import { HullIncomingUser } from "hull-connector-framework/src/purplefusion/hull-service-objects";

const {
  IntercomUserRead,
  IntercomLeadRead,
  IntercomCompanyRead,
  IntercomIncomingAttributeDefinition,
  IntercomOutgoingAttributeDefinition,
  IntercomAttributeWrite,
  IntercomAttributeMapping,
  IntercomWebhookLeadRead,
  IntercomWebhookUserRead,
  IntercomWebhookCompanyRead,
  IntercomWebhookLeadEventRead,
  IntercomWebhookUserEventRead,
  IntercomWebhookConversationEventRead,
  IntercomDeletedUserRead
} = require("./service-objects");

const EVENT_ACTION = {
  TRAITS: "traits",
  TRACK: "track"
};

const ENTITY_CLAIM = {
  USER: "asUser",
  ACCOUNT: "asAccount"
};

const EVENT_MAPPING = {
  "company.created": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.ACCOUNT,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookCompanyRead,
    "transformTo": IntercomCompanyRead
  },
  "contact.created": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookLeadRead,
    "transformTo": IntercomLeadRead
  },
  "contact.signed_up": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookUserRead,
    "transformTo": IntercomUserRead
  },
  "user.tag.created": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookUserRead,
    "transformTo": IntercomUserRead
  },
  "user.tag.deleted": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookUserRead,
    "transformTo": IntercomUserRead
  },
  "contact.tag.created": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item.contact",
    "webhookType": IntercomWebhookLeadRead,
    "transformTo": IntercomLeadRead
  },
  "contact.tag.deleted": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item.contact",
    "webhookType": IntercomWebhookLeadRead,
    "transformTo": IntercomLeadRead
  },
  "user.created": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": ENTITY_CLAIM.USER,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookUserRead,
    "transformTo": IntercomUserRead
  },
  "user.deleted": {
    "action": EVENT_ACTION.TRAITS,
    "asEntity": "userDeletedInService",
    "webhookType": IntercomDeletedUserRead,
    "transformTo": HullIncomingUser
  },
  // TODO write test for
  "conversation.user.created": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "User started conversation",
    "properties": {
      "message": "data.item.conversation_message.body",
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_message.author.type"
    },
    "context": {
      "ip": "data.item.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  // TODO write test for
  "conversation.user.replied": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "User replied to conversation",
    "properties": {
      "message": "data.item.conversation_parts.conversation_parts[0].body",
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_parts.conversation_parts[0].author.type"
    },
    "context": {
      "ip": "data.item.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  // TODO write test for
  "user.unsubscribed": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookUserEventRead,
    "eventName": "Unsubscribed from emails",
    "properties": {},
    "context": {
      "ip": "data.item.last_seen_ip",
      "event_type": "data.item.type" // TODO legacy is static 'email'
    }
  },
  "conversation.admin.replied": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin replied to conversation",
    "properties": {
      "message": "data.item.conversation_parts.conversation_parts[0].body",
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_parts.conversation_parts[0].author.type"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.single.created": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin started conversation",
    "properties": {
      "message": "data.item.conversation_message.body",
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_message.author.type"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation_part.redacted": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Conversation Part Redacted",
    "properties": {
      "message": "data.item.conversation_parts.conversation_parts[0].body",
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_message.author.type"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation_part.tag.created": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Conversation Part Tag Added",
    "properties": {
      "message": "data.item.conversation_message.body",
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_message.author.type",
      "tags_added": "data.item.tags_added.tags[0].name"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.assigned": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin assigned conversation",
    "properties": {
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.assignee.type",

      // legacy fields:
      "to": "data.item.user.id",
      "admin": "data.item.assignee.id",
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.closed": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin closed conversation",
    "properties": {
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",

      // legacy fields:
      "admin": "data.item.assignee.id",
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.opened": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin opened conversation",
    "properties": {
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",

      // legacy fields:
      "admin": "data.item.assignee.id",
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.noted": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin added note to conversation",
    "properties": {
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id",
      "initiated": "data.item.conversation_parts.conversation_parts[0].author.type",
      "author": "data.item.conversation_parts.conversation_parts[0].author.name",
      "note": "data.item.conversation_parts.conversation_parts[0].body"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.snoozed": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin snoozed conversation",
    "properties": {
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "conversation.admin.unsnoozed": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item.user",
    "webhookType": IntercomWebhookConversationEventRead,
    "eventName": "Admin unsnoozed conversation",
    "properties": {
      "link": "data.item.links.conversation_web",
      "assignee_name": "data.item.assignee.name",
      "assignee_email": "data.item.assignee.email",
      "assignee_id": "data.item.assignee.id"
    },
    "context": {
      "ip": "data.item.user.last_seen_ip",
      "event_type": "data.item.type"
    }
  },
  "user.email.updated": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookUserEventRead,
    "eventName": "Updated email address",
    "properties": {
      "email": "data.item.email"
    },
    "context": {
      "ip": "data.item.last_seen_ip",
      "event_type": "data.item.type" // TODO should be static 'email'
    }
  },
  "contact.added_email": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "data.item",
    "webhookType": IntercomWebhookLeadEventRead,
    "eventName": "Updated email address",
    "properties": {
      "email": "data.item.email"
    },
    "context": {
      "ip": "data.item.last_seen_ip",
      "event_type": "data.item.type" // TODO should be static 'email'
    }
  }
}

module.exports = {
  EVENT_MAPPING
}
