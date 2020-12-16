/* @flow */

type Traits = {
  [string]: any
};

export type UserIdentify = {
  userId?: string,
  anonymousId?: string,
  traits: Traits
};

export type UserEvent = {
  type: "track" | "screen" | "page",
  event: string,
  userId?: string,
  anonymousId?: string,
  traits?: Traits,
  properties: {
    [string]: any
  }
};

export type AccountGroup = {
  groupId: string,
  userId: string,
  traits?: Traits
};
export type Signal = {
  name: string,
  value: string | boolean | number,
  type: "postive" | "negative"
};
export type PersonData = {
  first_name: string,
  last_name: string,
  domain: string,
  is_student: boolean,
  is_spam: boolean,
  is_personal_email: boolean
};
export type CompanyData = {
  name: string,
  domain: string,
  industry?: string,
  location?: {
    state?: string,
    state_code?: string,
    country?: string,
    country_code?: string,
    tags?: Array<string>
  },
  number_of_employees?: number,
  industry?: string
};

export type Person = {
  object_type: "person",
  email: string,
  properties: {
    ...PersonData,
    customer_fit: {
      segment: string,
      score: number,
      top_signals: Array<Signal>
    }
  },
  company: {
    properties: CompanyData
  }
};
export type Company = {
  object_type: "company",
  domain: string,
  properties: {
    ...CompanyData,
    customer_fit?: {
      segment?: string,
      score?: number,
      top_signals?: Array<Signal>,
      top_signals_formated?: string
    }
  }
};
