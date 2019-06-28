const _ = require("lodash");

// Maps a single key in the source object to multiple in the destination object.
// The boolean value defines if we set the value or use `setIfNull`
// { domain: true, 'company/domain': false } =>
// { domain: { operation: "setIfNull", value: xxx }, "company/domain": xxx }

const multi = attributes =>
  _.map(attributes, (v, key) =>
    v
      ? {
          key,
          transform: value => ({ value, operation: "setIfNull" })
        }
      : {
          key,
          transform: value => value
        }
  );
export default {
  PersonCompany: {
    domain: multi({ domain: true })
  },
  Person: {
    "aboutme.avatar": "clearbit/aboutme_avatar",
    "aboutme.bio": "clearbit/aboutme_bio",
    "aboutme.handle": "clearbit/aboutme_handle",
    "angellist.avatar": "clearbit/angellist_avatar",
    "angellist.bio": "clearbit/angellist_bio",
    "angellist.blog": "clearbit/angellist_blog",
    "angellist.followers": "clearbit/angellist_followers",
    "angellist.handle": "clearbit/angellist_handle",
    "angellist.site": "clearbit/angellist_site",
    avatar: multi({ picture: true, "clearbit/avatar": false }),
    bio: "clearbit/bio",
    email: "clearbit/email",
    emailProvider: "clearbit/email_provider",
    "employment.domain": "clearbit/employment_domain",
    "employment.name": "clearbit/employment_name",
    "employment.role": "clearbit/employment_role",
    "employment.seniority": "clearbit/employment_seniority",
    "employment.title": "clearbit/employment_title",
    "facebook.handle": "clearbit/facebook_handle",
    gender: "clearbit/gender",
    "geo.city": multi({ address_city: true, "clearbit/geo_city": false }),
    "geo.countryCode": "clearbit/country_code",
    "geo.lat": "clearbit/lat",
    "geo.lng": "clearbit/lng",
    "geo.state": multi({
      address_state: true,
      "clearbit/geo_state": false
    }),
    "geo.stateCode": "clearbit/state_code",
    "github.avatar": "clearbit/github_avatar",
    "github.blog": "clearbit/github_blog",
    "github.company": "clearbit/github_company",
    "github.followers": "clearbit/github_followers",
    "github.following": "clearbit/github_following",
    "github.handle": "clearbit/github_handle",
    "googleplus.handle": "clearbit/googleplus_handle",
    "gravatar.avatar": "clearbit/gravatar_avatar",
    "gravatar.handle": "clearbit/gravatar_handle",
    id: "clearbit/id",
    indexedAt: "clearbit/indexed_at",
    fuzzy: "clearbit/fuzzy",
    "linkedin.handle": "clearbit/linkedin_handle",
    location: "clearbit/location",
    "name.familyName": multi({
      last_name: true,
      "clearbit/last_name": false
    }),
    "name.fullName": "clearbit/full_name",
    "name.givenName": multi({
      first_name: true,
      "clearbit/first_name": false
    }),
    site: "clearbit/site",
    timeZone: "clearbit/time_zone",
    "twitter.avatar": "clearbit/twitter_avatar",
    "twitter.bio": "clearbit/twitter_bio",
    "twitter.followers": "clearbit/twitter_followers",
    "twitter.following": "clearbit/twitter_following",
    "twitter.handle": "clearbit/twitter_handle",
    "twitter.id": "clearbit/twitter_id",
    "twitter.location": "clearbit/twitter_location",
    "twitter.site": "clearbit/twitter_site",
    utcOffset: "clearbit/utc_offset"
  },
  Prospect: {
    email: multi({ email: true, "clearbit/email": false }),
    id: "clearbit/prospect_id",
    "name.familyName": multi({
      last_name: true,
      "clearbit/last_name": false
    }),
    "name.fullName": "clearbit/full_name",
    "name.givenName": multi({
      first_name: true,
      "clearbit/first_name": false
    }),
    phone: "clearbit/phone",
    role: "clearbit/employment_role",
    seniority: "clearbit/employment_seniority",
    title: "clearbit/employment_title",
    verified: "clearbit/verified"
  },
  Company: {
    "angellist.avatar": "clearbit/angellist_avatar",
    "angellist.bio": "clearbit/angellist_bio",
    "angellist.blog": "clearbit/angellist_blog",
    "angellist.followers": "clearbit/angellist_followers",
    "angellist.handle": "clearbit/angellist_handle",
    "angellist.site": "clearbit/angellist_site",
    "category.industry": "clearbit/category_industry",
    "category.industryGroup": "clearbit/category_industry_group",
    "category.sector": "clearbit/category_sector",
    "category.subIndustry": "clearbit/category_sub_industry",
    "category.sicCode": "clearbit/category_sic_code",
    "category.naicsCode": "clearbit/category_naics_code",
    "crunchbase.handle": "clearbit/crunchbase_handle",
    description: "clearbit/description",
    domain: multi({ domain: true, "clearbit/domain": false }),
    domainAliases: "clearbit/domain_aliases",
    emailProvider: "clearbit/email_provider",
    "facebook.handle": "clearbit/facebook_handle",
    foundedYear: "clearbit/founded_year",
    "geo.city": "clearbit/geo_city",
    "geo.country": "clearbit/geo_country",
    "geo.countryCode": "clearbit/geo_country_code",
    "geo.lat": "clearbit/geo_lat",
    "geo.lng": "clearbit/geo_lng",
    "geo.postalCode": "clearbit/geo_postal_code",
    "geo.state": "clearbit/geo_state",
    "geo.stateCode": "clearbit/geo_state_code",
    "geo.streetName": "clearbit/geo_street_name",
    "geo.streetNumber": "clearbit/geo_street_number",
    "geo.subPremise": "clearbit/geo_sub_premise",
    id: "clearbit/id",
    "identifiers.usEIN": "clearbit/identifiers_us_ein",
    legalName: "clearbit/legal_name",
    "linkedin.handle": "clearbit/linkedin_handle",
    location: "clearbit/location",
    logo: "clearbit/logo",
    "metrics.alexaGlobalRank": "clearbit/metrics_alexa_global_rank",
    "metrics.alexaUsRank": "clearbit/metrics_alexa_us_rank",
    "metrics.annualRevenue": "clearbit/metrics_annual_revenue",
    "metrics.employees": "clearbit/metrics_employees",
    "metrics.employeesRange": "clearbit/metrics_employees_range",
    "metrics.estimatedAnnualRevenue":
      "clearbit/metrics_estimated_annual_revenue",
    "metrics.fiscalYearEnd": "clearbit/metrics_fiscal_year_end",
    "metrics.marketCap": "clearbit/metrics_market_cap",
    "metrics.raised": "clearbit/metrics_raised",
    name: multi({ name: true, "clearbit/name": false }),
    phone: "clearbit/phone",
    "site.emailAddresses": "clearbit/site_email_addresses",
    "site.phoneNumbers": "clearbit/site_phone_numbers",
    "site.title": "clearbit/site_title",
    "site.url": "clearbit/site_url",
    tags: "clearbit/tags",
    timeZone: "clearbit/time_zone",
    "twitter.avatar": "clearbit/twitter_avatar",
    "twitter.bio": "clearbit/twitter_bio",
    "twitter.followers": "clearbit/twitter_followers",
    "twitter.following": "clearbit/twitter_following",
    "twitter.handle": "clearbit/twitter_handle",
    "twitter.id": "clearbit/twitter_id",
    "twitter.location": "clearbit/twitter_location",
    "twitter.site": "clearbit/twitter_site",
    type: "clearbit/type",
    utcOffset: "clearbit/utc_offset",
    tech: "clearbit/tech"
  }
};
