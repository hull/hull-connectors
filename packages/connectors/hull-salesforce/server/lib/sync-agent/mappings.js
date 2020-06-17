/* eslint-disable */

const RELATED_ENTITY_MAPPING = {
  Lead: [
    { id: "OwnerId", attribute: "Owner.Email", related_entity: "User", related_attribute: "Email" }
  ],
  Contact: [
    { id: "OwnerId", attribute: "Owner.Email", related_entity: "User", related_attribute: "Email" }
  ],
  Account: [
    { id: "OwnerId", attribute: "Owner.Email", related_entity: "User", related_attribute: "Email" }
  ],
  Task: [
    { id: "OwnerId", attribute: "Owner.Email", related_entity: "User", related_attribute: "Email" }
  ]
};

/* eslint-disable no-multi-spaces */
const DEFAULT_MAPPING = {
  Lead: [
    { service: "Email", hull_top_level_trait: null, hull: "email", type: "string" },
    { service: "FirstName", hull_top_level_trait: "first_name", hull: "first_name", type: "string" },
    { service: "LastName", hull_top_level_trait: "last_name", hull: "last_name",  type: "string" },
    { service: "Id", hull_top_level_trait: null, hull: "id", type: "string" },
    { service: "ConvertedAccountId", hull_top_level_trait: null, hull: "converted_account_id", type: "string" },
    { service: "ConvertedContactId", hull_top_level_trait: null, hull: "converted_contact_id", type: "string" }
  ],
  Contact: [
    { service: "Email",     hull_top_level_trait: null,         hull: "email",      type: "string" },
    { service: "FirstName", hull_top_level_trait: "first_name", hull: "first_name", type: "string" },
    { service: "LastName",  hull_top_level_trait: "last_name",  hull: "last_name",  type: "string" },
    { service: "Id",        hull_top_level_trait: null,         hull: "id",         type: "string" },
    { service: "AccountId", hull_top_level_trait: null,         hull: "account_id", type: "string" }
  ],
  Account: [
    { service: "Id",        hull_top_level_trait: null,         hull: "id",         type: "string" },
    { service: "Website",   hull_top_level_trait: "domain",     hull: "website",    type: "string" }
  ],
  Task: [
    { service: "Id", hull: "Id", type: "string" },
    { service: "Subject", hull: "Subject", type: "string" },
    { service: "WhoId", hull: "WhoId", type: "string" },
    { service: "Status", hull: "Status", type: "string" },
    { service: "AccountId", hull: "AccountId", type: "string" },
    { service: "CreatedDate", hull: "CreatedDate_at", type: "date" },
    { service: "IsArchived", hull: "IsArchived", type: "string" },
    { service: "OwnerId", hull: "OwnerId", type: "string" },
    { service: "CallDurationInSeconds", hull: "CallDurationInSeconds", type: "string" },
    { service: "CallObject", hull: "CallObject", type: "string" },
    { service: "CallDisposition", hull: "CallDisposition", type: "string" },
    { service: "CallType", hull: "CallType", type: "string" },
    { service: "IsClosed", hull: "IsClosed", type: "string" },
    { service: "Description", hull: "Description", type: "string" },
    { service: "IsRecurrence", hull: "IsRecurrence", type: "string" },
    { service: "CreatedById", hull: "CreatedById", type: "string" },
    { service: "IsDeleted", hull: "IsDeleted", type: "string" },
    { service: "ActivityDate", hull: "ActivityDate_at", type: "date" },
    { service: "RecurrenceEndDateOnly", hull: "RecurrenceEndDateOnly", type: "string" },
    { service: "IsHighPriority", hull: "IsHighPriority", type: "string" },
    { service: "LastModifiedById", hull: "LastModifiedById", type: "string" },
    { service: "LastModifiedDate", hull: "LastModifiedDate_at", type: "date" },
    { service: "Priority", hull: "Priority", type: "string" },
    { service: "RecurrenceActivityId", hull: "RecurrenceActivityId", type: "string" },
    { service: "RecurrenceDayOfMonth", hull: "RecurrenceDayOfMonth", type: "string" },
    { service: "RecurrenceDayOfWeekMask", hull: "RecurrenceDayOfWeekMask", type: "string" },
    { service: "RecurrenceInstance", hull: "RecurrenceInstance", type: "string" },
    { service: "RecurrenceInterval", hull: "RecurrenceInterval", type: "string" },
    { service: "RecurrenceMonthOfYear", hull: "RecurrenceMonthOfYear", type: "string" },
    { service: "RecurrenceTimeZoneSidKey", hull: "RecurrenceTimeZoneSidKey", type: "string" },
    { service: "RecurrenceType", hull: "RecurrenceType", type: "string" },
    { service: "WhatId", hull: "WhatId", type: "string" },
    { service: "ReminderDateTime", hull: "ReminderDateTime", type: "string" },
    { service: "IsReminderSet", hull: "IsReminderSet", type: "string" },
    { service: "RecurrenceRegeneratedType", hull: "RecurrenceRegeneratedType", type: "string" },
    { service: "RecurrenceStartDateOnly", hull: "RecurrenceStartDateOnly_at", type: "date" },
    { service: "Type", hull: "Type", type: "string" }

  ]
};

module.exports = {
  DEFAULT_MAPPING,
  RELATED_ENTITY_MAPPING,
};

