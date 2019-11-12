import company from "./company.json";

export default function(expect, source="reveal") {
  return {
    domain: {
      operation: "setIfNull",
      value: company.domain
    },
    name: {
      operation: "setIfNull",
      value: company.name
    },
    [`clearbit/${source}ed_at`]: expect.whatever(),
    "clearbit/fetched_at": {
      operation: "setIfNull",
      value: expect.whatever()
    },
    "clearbit/source": {
      operation: "setIfNull",
      value: source
    },
    "clearbit/category_industry": "Internet Software & Services",
    "clearbit/category_industry_group": "Software & Services",
    "clearbit/category_naics_code": "51",
    "clearbit/category_sector": "Information Technology",
    "clearbit/category_sic_code": "47",
    "clearbit/category_sub_industry": "Internet Software & Services",
    "clearbit/crunchbase_handle": "organization/uber",
    "clearbit/description":
      "Get a taxi, private car or rideshare from your mobile phone. Uber connects you with a driver in minutes. Use our app in cities around the world.",
    "clearbit/domain": company.domain,
    "clearbit/domain_aliases": ["uber.org", "ubercab.com"],
    "clearbit/email_provider": false,
    "clearbit/facebook_handle": "uber",
    "clearbit/founded_year": 2009,
    "clearbit/geo_city": "San Francisco",
    "clearbit/geo_country": "United States",
    "clearbit/geo_country_code": "US",
    "clearbit/geo_lat": 37.7752315,
    "clearbit/geo_lng": -122.4175278,
    "clearbit/geo_postal_code": "94103",
    "clearbit/geo_state": "California",
    "clearbit/geo_state_code": "CA",
    "clearbit/geo_street_name": "Market Street",
    "clearbit/geo_street_number": "1455",
    "clearbit/geo_sub_premise": null,
    "clearbit/id": "3f5d6a4e-c284-4f78-bfdf-7669b45af907",
    "clearbit/identifiers_us_ein": "452647441",
    "clearbit/legal_name": "Uber Technologies, Inc.",
    "clearbit/linkedin_handle": "company/uber-com",
    "clearbit/location": "1455 Market St, San Francisco, CA 94103, USA",
    "clearbit/logo": "https://logo.clearbit.com/uber.com",
    "clearbit/metrics_alexa_global_rank": 943,
    "clearbit/metrics_alexa_us_rank": 544,
    "clearbit/metrics_annual_revenue": null,
    "clearbit/metrics_employees": 20313,
    "clearbit/metrics_employees_range": "10k-50k",
    "clearbit/metrics_estimated_annual_revenue": "$1B-$10B",
    "clearbit/metrics_fiscal_year_end": 12,
    "clearbit/metrics_market_cap": null,
    "clearbit/metrics_raised": 10610000000,
    "clearbit/name": company.name,
    "clearbit/parent_domain": null,
    "clearbit/phone": null,
    "clearbit/site_email_addresses": ["domains@uber.com"],
    "clearbit/site_phone_numbers": [],
    "clearbit/tags": [
      "Technology",
      "Marketplace",
      "Mobile",
      "B2C",
      "Ground Transportation",
      "Transportation",
      "Internet"
    ],
    "clearbit/tech": [
      "google_analytics",
      "double_click",
      "mixpanel",
      "optimizely",
      "typekit_by_adobe",
      "android",
      "nginx",
      "ios",
      "mixpanel",
      "google_apps"
    ],
    "clearbit/time_zone": "America/Los_Angeles",
    "clearbit/twitter_avatar":
      "https://pbs.twimg.com/profile_images/697242369154940928/p9jxYqy5_normal.png",
    "clearbit/twitter_bio":
      "Evolving the way the world moves by seamlessly connecting riders to drivers through our app. Question, concern, or praise? Tweet at @Uber_Support.",
    "clearbit/twitter_followers": 570351,
    "clearbit/twitter_following": 377,
    "clearbit/twitter_handle": "Uber",
    "clearbit/twitter_id": "19103481",
    "clearbit/twitter_location": "Global",
    "clearbit/twitter_site": "http://t.co/11eIV5LX3Z",
    "clearbit/type": "private",
    "clearbit/utc_offset": -7
  };
}
