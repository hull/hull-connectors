/* @flow */
/**
 * Same type of stuff we'd have in Types
 * Perhaps abstract the whole "data" payload concept
 * that should be the only thing we ever care about...
 */

class OutreachProspectAttributes {
  // addedAt = { type: "Date", format: "" };
  //
  // addressCity = { in: "false", default: "true"};
  addedAt: Date;

  addressCity: string;

  addressCountry: string;

  addressState: string;

  addressStreet: string;

  addressStreet2: string;

  addressZip: string;

  angelListUrl: string;

  availableAt: string;

  callsOptedOutAt: string;

  campaignName: string;

  clickCount: number;

  createdAt: Date;

  custom1: string;

  custom10: string;

  custom11: string;

  custom12: string;

  custom13: string;

  custom14: string;

  custom15: string;

  custom16: string;

  custom17: string;

  custom18: string;

  custom19: string;

  custom2: string;

  custom20: string;

  custom21: string;

  custom22: string;

  custom23: string;

  custom24: string;

  custom25: string;

  custom26: string;

  custom27: string;

  custom28: string;

  custom29: string;

  custom3: string;

  custom30: string;

  custom31: string;

  custom32: string;

  custom33: string;

  custom34: string;

  custom35: string;

  custom4: string;

  custom5: string;

  custom6: string;

  custom7: string;

  custom8: string;

  custom9: string;

  dateOfBirth: string;

  degree: string;

  emails: Array<string>;

  emailsOptedOutAt: string;

  engagedAt: string;

  engagedScore: number;

  eventName: string;

  externalId: string;

  externalOwner: string;

  externalSource: string;

  facebookUrl: string;

  firstName: string;

  gender: string;

  githubUrl: string;

  githubUsername: string;

  googlePlusUrl: string;

  graduationDate: string;

  homePhones: Array<string>;

  jobStartDate: string;

  lastName: string;

  linkedInConnections: string;

  linkedInId: string;

  linkedInSlug: string;

  linkedInUrl: string;

  middleName: string;

  mobilePhones: Array<string>;

  name: string;

  nickname: string;

  occupation: string;

  openCount: number;

  optedOut: boolean;

  optedOutAt: string;

  otherPhones: Array<string>;

  personalNote1: string;

  personalNote2: string;

  preferredContact: string;

  quoraUrl: string;

  region: string;

  replyCount: number;

  school: string;

  score: string;

  smsOptedOutAt: string;

  source: string;

  specialties: string;

  stackOverflowId: string;

  stackOverflowUrl: string;

  tags: Array<string>;

  timeZone: string;

  timeZoneIana: string;

  timeZoneInferred: string;

  title: String;

  touchedAt: string;

  twitterUrl: string;

  twitterUsername: string;

  updatedAt: Date;

  voipPhones: Array<string>;

  websiteUrl1: string;

  websiteUrl2: string;

  websiteUrl3: string;

  workPhones: Array<string>;
}

class OutreachGenericIdentifierReadData {
  type: string;

  id: number;
}

class OutreachGenericIdentifierRead {
  data: OutreachGenericIdentifierReadData;
}

class OutreachProspectRelationships {
  account: OutreachGenericIdentifierRead;
}

class OutreachProspectReadData {
  id: string;

  type: string;

  attributes: OutreachProspectAttributes;

  relationships: OutreachProspectRelationships;
}

class OutreachProspectRead {
  data: OutreachProspectReadData;
}

class OutreachProspectWriteData {
  type: string;

  id: number;

  attributes: OutreachProspectAttributes;

  relationships: OutreachProspectRelationships;
}

class OutreachProspectWrite {
  data: OutreachProspectWriteData;
}

class OutreachAccountAttributes {
  companyType: string;

  createdAt: Date;

  custom1: string;

  custom2: string;

  custom3: string;

  custom4: string;

  custom5: string;

  custom6: string;

  custom7: string;

  custom8: string;

  custom9: string;

  custom10: string;

  custom11: string;

  custom12: string;

  custom13: string;

  custom14: string;

  custom15: string;

  custom16: string;

  custom17: string;

  custom18: string;

  custom19: string;

  custom20: string;

  custom21: string;

  custom22: string;

  custom23: string;

  custom24: string;

  custom25: string;

  custom26: string;

  custom27: string;

  custom28: string;

  custom29: string;

  custom30: string;

  custom31: string;

  custom32: string;

  custom33: string;

  custom34: string;

  custom35: string;

  customId: string;

  description: string;

  domain: string;

  externalSource: string;

  followers: string;

  foundedAt: Date;

  industry: string;

  linkedInEmployees: string;

  linkedInUrl: string;

  locality: string;

  name: string;

  named: boolean;

  naturalName: string;

  numberOfEmployees: number;

  tags: Array<string>;

  updatedAt: Date;

  websiteUrl: string;
}

class OutreachAccountReadData {
  type: string;

  id: string;

  attributes: OutreachAccountAttributes;
}

class OutreachAccountRead {
  data: OutreachAccountReadData;
}

class OutreachAccountWriteData {
  type: string;

  id: number;

  attributes: OutreachAccountAttributes;
}

class OutreachAccountWrite {
  data: OutreachAccountWriteData;
}

class OutreachWebhookWrite {

}

class WebhookPayloadData {
  type: string;
  id: number;
  attributes: Object;
}
class WebhookPayloadMeta {
  deliveredAt: Date;
  eventName: string;
}

class WebhookPayload {
  data: WebhookPayloadData;
  meta: WebhookPayloadMeta;
}

module.exports = {
  WebhookPayload,
  OutreachWebhookWrite,
  OutreachProspectRead,
  OutreachProspectWrite,
  OutreachAccountWrite,
  OutreachAccountRead
};
