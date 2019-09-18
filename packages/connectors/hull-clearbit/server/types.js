// @flow
export type ShouldAction = {
  should: boolean,
  message?: string
};

export type ClearbitResult = {
  source: "enrich" | "reveal" | "prospect" | "discover",
  action: "success" | "error",
  message?: string
};

export type ClearbitProspect = {
  id: string,
  name: {
    givenName: string,
    familyName: string,
    fullName: string
  },
  title: string,
  role: string,
  subRole: string,
  seniority: string,
  company: {
    name: string
  },
  email: string,
  verified: boolean,
  phone: string
};

export type ClearbitPerson = {
  id: string,
  name: {
    fullName: string,
    givenName: string,
    familyName: string
  },
  email: string,
  location: string,
  timeZone: string,
  utcOffset: number,
  geo: {
    city: string,
    state: string,
    stateCode: string,
    country: string,
    countryCode: string,
    lat: number,
    lng: number
  },
  bio: string,
  site: string,
  avatar: string,
  employment: {
    domain: string,
    name: string,
    title: string,
    role: string,
    subRole: string,
    seniority: string
  },
  facebook: {
    handle: string
  },
  github: {
    handle: string,
    avatar: string,
    company: string,
    blog: string,
    followers: number,
    following: number
  },
  twitter: {
    handle: string,
    id: string,
    bio: string,
    followers: number,
    following: number,
    location: string,
    site: string,
    avatar: string
  },
  linkedin: {
    handle: string
  },
  googleplus: {
    handle: ?string
  },
  gravatar: {
    handle: string,
    urls: Array<{
      value: string,
      title: string
    }>,
    avatar: string,
    avatars: Array<{
      url: string,
      type: string
    }>
  },
  fuzzy: boolean,
  emailProvider: boolean,
  indexedAt: string
};

export type ClearbitCompany = {
  id: string,
  name: string,
  legalName: string,
  domain: string,
  domainAliases: Array<string>,
  site: {
    phoneNumbers: Array<string>,
    emailAddresses: Array<string>
  },
  category: {
    sector: string,
    industryGroup: string,
    industry: string,
    subIndustry: string,
    sicCode: string,
    naicsCode: string
  },
  tags: Array<string>,
  description: string,
  foundedYear: number,
  location: string,
  timeZone: string,
  utcOffset: number,
  geo: {
    streetNumber: string,
    streetName: string,
    subPremise: ?string,
    city: string,
    postalCode: string,
    state: string,
    stateCode: string,
    country: string,
    countryCode: string,
    lat: number,
    lng: number
  },
  logo: string,
  facebook: {
    handle: string
  },
  linkedin: {
    handle: string
  },
  twitter: {
    handle: string,
    id: string,
    bio: string,
    followers: number,
    following: number,
    location: string,
    site: string,
    avatar: string
  },
  crunchbase: {
    handle: string
  },
  emailProvider: boolean,
  type: string,
  ticker: ?string,
  identifiers: {
    usEIN: string
  },
  phone: ?string,
  indexedAt: string,
  metrics: {
    alexaUsRank: number,
    alexaGlobalRank: number,
    employees: number,
    employeesRange: string,
    marketCap: ?string,
    raised: number,
    annualRevenue: ?string,
    estimatedAnnualRevenue: string,
    fiscalYearEnd: number
  },
  tech: Array<string>,
  parent: {
    domain: ?string
  },
  ultimate_parent: {
    domain: ?string
  }
};

export type ClearbitPrivateSettings = {
  api_key: string,

  discover_limit_count: number,
  discover_segments: Array<string>,

  enrich_user_segments: Array<string>,
  enrich_account_segments: Array<string>,

  prospect_segments: Array<string>,
  prospect_filter_role: Array<string>,
  prospect_filter_seniority: Array<string>,
  prospect_filter_titles: Array<string>,
  prospect_limit_count: number,

  reveal_prospect_min_contacts: number,
  reveal_segments: Array<string>
};
