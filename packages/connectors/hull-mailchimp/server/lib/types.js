/* @flow */

import type { HullUserUpdateMessage } from "hull";

export type TMailchimpNewMember = {
  email_address: string,
  email_type: string,
  status_if_new: string,
  merge_fields: Object,
  interests: Object
};

export type TMailchimpCurrentMember = {
  id: string,
  email_address: string,

  email: string, // found in code? possibly to be removed
  merges: Object, // found in code? possibly to be removed

  unique_email_id: string,
  email_type: string,
  status: string,
  merge_fields: Object,
  interests: Object,
  stats: Object,
  ip_signup: string,
  timestamp_signup: string,
  ip_opt: string,
  timestamp_opt: string,
  member_rating: Number,
  last_changed: string,
  language: string,
  vip: boolean,
  email_client: string,
  location: Object,
  list_id: string
};

export type TMailchimpWebhookPayload = {
  id: string,
  email: string,
  email_address: string, // probably does not exists
  email_type: string,
  ip_opt: string,
  web_id: string,
  merges: {
    [string]: string,
    INTERESTS: string,
    GROUPINGS: Array<Object>
  },
  list_id: string
};

export type TMailchimpMergeFields = {
  [string]: string
};

export interface IUserUpdateEnvelope {
  message: HullUserUpdateMessage;
  mailchimpNewMember: TMailchimpNewMember;
  staticSegmentsToAdd: Array<string>;
  staticSegmentsToRemove: Array<string>;
  mailchimpCurrentMember?: TMailchimpCurrentMember;
  skipReason?: string;
  permanentError?: string; // this is an error which is related to user data structure and won't go away without user data change, like faked or invalid
  temporaryError?: string; // this is an error which can be retried
  warning?: string;
}
