// @flow
// const _ = require("lodash");

// Maps a single key in the source object to multiple in the destination object.
// The boolean value defines if we set the value or use `setIfNull`
// { domain: true, 'company/domain': false } =>
// { domain: { operation: "setIfNull", value: xxx }, "company/domain": xxx }

// const multi = attributes =>
//   _.map(attributes, (v, key) =>
//     v
//       ? {
//           key,
//           transform: value => ({ value, operation: "setIfNull" })
//         }
//       : {
//           key,
//           transform: value => value
//         }
//   );
export default {
  // PersonCompany: {
  //   domain: multi({ domain: true })
  // },
  Person: [
    { service: "id", hull: "clearbit/id", overwrite: true },
    { service: "bio", hull: "clearbit/bio", overwrite: true },
    {
      service: "indexedAt",
      hull: "clearbit/indexed_at",
      overwrite: true
    },
    { service: "avatar", hull: "clearbit/avatar", overwrite: true },
    {
      service: "emailProvider",
      hull: "clearbit/email_provider",
      overwrite: true
    },
    { service: "fuzzy", hull: "clearbit/fuzzy", overwrite: true },
    { service: "location", hull: "clearbit/location", overwrite: true },
    { service: "site", hull: "clearbit/site", overwrite: true },
    { service: "timeZone", hull: "clearbit/time_zone", overwrite: true },
    {
      service: "utcOffset",
      hull: "clearbit/utc_offset",
      overwrite: true
    },
    {
      service: "name.familyName",
      hull: "clearbit/family_name",
      overwrite: true
    },
    {
      service: "name.fullName",
      hull: "clearbit/full_name",
      overwrite: true
    },
    {
      service: "name.givenName",
      hull: "clearbit/given_name",
      overwrite: true
    },
    {
      service: "employment.domain",
      hull: "clearbit/employment_domain",
      overwrite: true
    },
    {
      service: "employment.name",
      hull: "clearbit/employment_name",
      overwrite: true
    },
    {
      service: "employment.role",
      hull: "clearbit/employment_role",
      overwrite: true
    },
    {
      service: "employment.seniority",
      hull: "clearbit/employment_seniority",
      overwrite: true
    },
    {
      service: "employment.subRole",
      hull: "clearbit/employment_sub_role",
      overwrite: true
    },
    {
      service: "employment.title",
      hull: "clearbit/employment_title",
      overwrite: true
    },
    {
      service: "facebook.handle",
      hull: "clearbit/facebook_handle",
      overwrite: true
    },
    { service: "geo.city", hull: "clearbit/geo_city", overwrite: true },
    {
      service: "geo.country",
      hull: "clearbit/geo_country",
      overwrite: true
    },
    { service: "geo.lat", hull: "clearbit/geo_lat", overwrite: true },
    { service: "geo.lng", hull: "clearbit/geo_lng", overwrite: true },
    {
      service: "geo.state",
      hull: "clearbit/geo_state",
      overwrite: true
    },
    {
      service: "github.avatar",
      hull: "clearbit/github_avatar",
      overwrite: true
    },
    {
      service: "github.blog",
      hull: "clearbit/github_blog",
      overwrite: true
    },
    {
      service: "github.company",
      hull: "clearbit/github_company",
      overwrite: true
    },
    {
      service: "github.followers",
      hull: "clearbit/github_followers",
      overwrite: true
    },
    {
      service: "github.following",
      hull: "clearbit/github_following",
      overwrite: true
    },
    {
      service: "github.handle",
      hull: "clearbit/github_handle",
      overwrite: true
    },
    {
      service: "github.id",
      hull: "clearbit/github_id",
      overwrite: true
    },
    {
      service: "googleplus.handle",
      hull: "clearbit/googleplus_handle",
      overwrite: true
    },
    {
      service: "gravatar.avatar",
      hull: "clearbit/gravatar_avatar",
      overwrite: true
    },
    {
      service: "gravatar.avatars",
      hull: "clearbit/gravatar_avatars",
      overwrite: true
    },
    {
      service: "gravatar.handle",
      hull: "clearbit/gravatar_handle",
      overwrite: true
    },
    {
      service: "gravatar.urls",
      hull: "clearbit/gravatar_urls",
      overwrite: true
    },
    {
      service: "linkedin.handle",
      hull: "clearbit/linkedin_handle",
      overwrite: true
    },
    {
      service: "twitter.avatar",
      hull: "clearbit/twitter_avatar",
      overwrite: true
    },
    {
      service: "twitter.favorites",
      hull: "clearbit/twitter_favorites",
      overwrite: true
    },
    {
      service: "twitter.followers",
      hull: "clearbit/twitter_followers",
      overwrite: true
    },
    {
      service: "twitter.following",
      hull: "clearbit/twitter_following",
      overwrite: true
    },
    {
      service: "twitter.handle",
      hull: "clearbit/twitter_handle",
      overwrite: true
    },
    {
      service: "twitter.id",
      hull: "clearbit/twitter_id",
      overwrite: true
    },
    {
      service: "twitter.location",
      hull: "clearbit/twitter_location",
      overwrite: true
    },
    {
      service: "twitter.site",
      hull: "clearbit/twitter_site",
      overwrite: true
    },
    {
      service: "twitter.statuses",
      hull: "clearbit/twitter_statuses",
      overwrite: true
    }
  ],
  Prospect: [
    { service: "email", hull: "clearbit/email", overwrite: true },
    { service: "id", hull: "clearbit/prospect_id", overwrite: true },
    { service: "phone", hull: "clearbit/phone", overwrite: true },
    {
      service: "role",
      hull: "clearbit/employment_role",
      overwrite: true
    },
    {
      service: "subRole",
      hull: "clearbit/employment_sub_role",
      overwrite: true
    },
    {
      service: "seniority",
      hull: "clearbit/employment_seniority",
      overwrite: true
    },
    {
      service: "title",
      hull: "clearbit/employment_title",
      overwrite: true
    },
    { service: "verified", hull: "clearbit/verified", overwrite: true },
    {
      service: "name.familyName",
      hull: "clearbit/last_name",
      overwrite: true
    },
    {
      service: "name.fullName",
      hull: "clearbit/full_name",
      overwrite: true
    },
    {
      service: "name.givenName",
      hull: "clearbit/first_name",
      overwrite: true
    },
    {
      service: "company.name",
      hull: "clearbit/company_name",
      overwrite: true
    }
  ],
  Company: [
    { service: "id", hull: "clearbit/id", overwrite: true },
    { service: "legalName", hull: "clearbit/legal_name", overwrite: true },
    { service: "location", hull: "clearbit/location", overwrite: true },
    { service: "logo", hull: "clearbit/logo", overwrite: true },
    { service: "name", hull: "clearbit/name", overwrite: true },
    { service: "phone", hull: "clearbit/phone", overwrite: true },
    { service: "tags", hull: "clearbit/tags", overwrite: true },
    { service: "timeZone", hull: "clearbit/time_zone", overwrite: true },
    { service: "type", hull: "clearbit/type", overwrite: true },
    { service: "utcOffset", hull: "clearbit/utc_offset", overwrite: true },
    { service: "tech", hull: "clearbit/tech", overwrite: true },
    { service: "foundedYear", hull: "clearbit/founded_year", overwrite: true },
    { service: "description", hull: "clearbit/description", overwrite: true },
    { service: "domain", hull: "clearbit/domain", overwrite: true },
    {
      service: "domainAliases",
      hull: "clearbit/domain_aliases",
      overwrite: true
    },
    {
      service: "emailProvider",
      hull: "clearbit/email_provider",
      overwrite: true
    },

    {
      service: "parent.domain",
      hull: "clearbit/parent_domain",
      overwrite: true
    },
    {
      service: "ultimate_parent.domain",
      hull: "clearbit/ultimate_parent_domain",
      overwrite: true
    },
    {
      service: "category.industry",
      hull: "clearbit/category_industry",
      overwrite: true
    },
    {
      service: "category.industryGroup",
      hull: "clearbit/category_industry_group",
      overwrite: true
    },
    {
      service: "category.sector",
      hull: "clearbit/category_sector",
      overwrite: true
    },
    {
      service: "category.subIndustry",
      hull: "clearbit/category_sub_industry",
      overwrite: true
    },
    {
      service: "category.sicCode",
      hull: "clearbit/category_sic_code",
      overwrite: true
    },
    {
      service: "category.naicsCode",
      hull: "clearbit/category_naics_code",
      overwrite: true
    },
    { service: "geo.city", hull: "clearbit/geo_city", overwrite: true },
    { service: "geo.country", hull: "clearbit/geo_country", overwrite: true },
    {
      service: "geo.countryCode",
      hull: "clearbit/geo_country_code",
      overwrite: true
    },
    { service: "geo.lat", hull: "clearbit/geo_lat", overwrite: true },
    { service: "geo.lng", hull: "clearbit/geo_lng", overwrite: true },
    {
      service: "geo.postalCode",
      hull: "clearbit/geo_postal_code",
      overwrite: true
    },
    { service: "geo.state", hull: "clearbit/geo_state", overwrite: true },
    {
      service: "geo.stateCode",
      hull: "clearbit/geo_state_code",
      overwrite: true
    },
    {
      service: "geo.streetName",
      hull: "clearbit/geo_street_name",
      overwrite: true
    },
    {
      service: "geo.streetNumber",
      hull: "clearbit/geo_street_number",
      overwrite: true
    },
    {
      service: "geo.subPremise",
      hull: "clearbit/geo_sub_premise",
      overwrite: true
    },
    {
      service: "metrics.alexaGlobalRank",
      hull: "clearbit/metrics_alexa_global_rank",
      overwrite: true
    },
    {
      service: "metrics.alexaUsRank",
      hull: "clearbit/metrics_alexa_us_rank",
      overwrite: true
    },
    {
      service: "metrics.annualRevenue",
      hull: "clearbit/metrics_annual_revenue",
      overwrite: true
    },
    {
      service: "metrics.employees",
      hull: "clearbit/metrics_employees",
      overwrite: true
    },
    {
      service: "metrics.employeesRange",
      hull: "clearbit/metrics_employees_range",
      overwrite: true
    },
    {
      service: "metrics.estimatedAnnualRevenue",
      hull: "clearbit/metrics_estimated_annual_revenue",
      overwrite: true
    },
    {
      service: "metrics.fiscalYearEnd",
      hull: "clearbit/metrics_fiscal_year_end",
      overwrite: true
    },
    {
      service: "metrics.marketCap",
      hull: "clearbit/metrics_market_cap",
      overwrite: true
    },
    {
      service: "metrics.raised",
      hull: "clearbit/metrics_raised",
      overwrite: true
    },
    {
      service: "crunchbase.handle",
      hull: "clearbit/crunchbase_handle",
      overwrite: true
    },
    {
      service: "facebook.handle",
      hull: "clearbit/facebook_handle",
      overwrite: true
    },
    {
      service: "site.emailAddresses",
      hull: "clearbit/site_email_addresses",
      overwrite: true
    },
    {
      service: "site.phoneNumbers",
      hull: "clearbit/site_phone_numbers",
      overwrite: true
    },
    { service: "site.title", hull: "clearbit/site_title", overwrite: true },
    { service: "site.url", hull: "clearbit/site_url", overwrite: true },
    {
      service: "identifiers.usEIN",
      hull: "clearbit/identifiers_us_ein",
      overwrite: true
    },
    {
      service: "linkedin.handle",
      hull: "clearbit/linkedin_handle",
      overwrite: true
    },
    {
      service: "twitter.avatar",
      hull: "clearbit/twitter_avatar",
      overwrite: true
    },
    { service: "twitter.bio", hull: "clearbit/twitter_bio", overwrite: true },
    {
      service: "twitter.followers",
      hull: "clearbit/twitter_followers",
      overwrite: true
    },
    {
      service: "twitter.following",
      hull: "clearbit/twitter_following",
      overwrite: true
    },
    {
      service: "twitter.handle",
      hull: "clearbit/twitter_handle",
      overwrite: true
    },
    { service: "twitter.id", hull: "clearbit/twitter_id", overwrite: true },
    {
      service: "twitter.location",
      hull: "clearbit/twitter_location",
      overwrite: true
    },
    { service: "twitter.site", hull: "clearbit/twitter_site", overwrite: true }
  ]
};
