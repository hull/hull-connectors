import person from "./person.json";

export default function(expect, source="reveal") {
  return {
    address: {
      city: {
        operation: "setIfNull",
        value: "San Francisco"
      },
      country: {
        operation: "setIfNull",
        value: "United States"
      },
      state: {
        operation: "setIfNull",
        value: "California"
      }
    },
    bio: {
      operation: "setIfNull",
      value:
        "O'Reilly author, software engineer & traveller. Founder of https://clearbit.com"
    },
    [`clearbit/${source}ed_at`]: expect.whatever(),
    "clearbit/fetched_at": expect.whatever(),
    "clearbit/source": {
      operation: "setIfNull",
      value: source
    },
    "clearbit/avatar":
      "https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/d54c54ad-40be-4305-8a34-0ab44710b90d",
    "clearbit/bio":
      "O'Reilly author, software engineer & traveller. Founder of https://clearbit.com",
    "clearbit/country_code": "US",
    "clearbit/email": "alex@alexmaccaw.com",
    "clearbit/email_provider": false,
    "clearbit/employment_domain": "clearbit.com",
    "clearbit/employment_name": "Clearbit",
    "clearbit/employment_role": "ceo",
    "clearbit/employment_seniority": "executive",
    "clearbit/employment_title": "Founder and CEO",
    "clearbit/facebook_handle": "amaccaw",
    "clearbit/first_name": "Alex",
    "clearbit/full_name": "Alex MacCaw",
    "clearbit/fuzzy": false,
    "clearbit/geo_city": "San Francisco",
    "clearbit/geo_state": "California",
    "clearbit/github_avatar":
      "https://avatars.githubusercontent.com/u/2142?v=2",
    "clearbit/github_blog": "http://alexmaccaw.com",
    "clearbit/github_company": "Clearbit",
    "clearbit/github_followers": 2932,
    "clearbit/github_following": 94,
    "clearbit/github_handle": "maccman",
    "clearbit/googleplus_handle": null,
    "clearbit/gravatar_avatar":
      "http://2.gravatar.com/avatar/994909da96d3afaf4daaf54973914b64",
    "clearbit/gravatar_handle": "maccman",
    "clearbit/id": "d54c54ad-40be-4305-8a34-0ab44710b90d",
    "clearbit/indexed_at": "2016-11-07T00:00:00.000Z",
    "clearbit/last_name": "MacCaw",
    "clearbit/lat": 37.7749295,
    "clearbit/linkedin_handle": "pub/alex-maccaw/78/929/ab5",
    "clearbit/lng": -122.4194155,
    "clearbit/location": "San Francisco, CA, US",
    "clearbit/site": "http://alexmaccaw.com",
    "clearbit/state_code": "CA",
    "clearbit/time_zone": "America/Los_Angeles",
    "clearbit/twitter_avatar":
      "https://pbs.twimg.com/profile_images/1826201101/297606_10150904890650705_570400704_21211347_1883468370_n.jpeg",
    "clearbit/twitter_bio":
      "O'Reilly author, software engineer & traveller. Founder of https://clearbit.com",
    "clearbit/twitter_followers": 15248,
    "clearbit/twitter_following": 1711,
    "clearbit/twitter_handle": "maccaw",
    "clearbit/twitter_id": "2006261",
    "clearbit/twitter_location": "San Francisco",
    "clearbit/twitter_site": "http://alexmaccaw.com",
    "clearbit/utc_offset": -8,
    email: {
      operation: "setIfNull",
      value: "alex@alexmaccaw.com"
    },
    first_name: {
      operation: "setIfNull",
      value: "Alex"
    },
    last_name: {
      operation: "setIfNull",
      value: "MacCaw"
    },
    picture: {
      operation: "setIfNull",
      value:
        "https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/d54c54ad-40be-4305-8a34-0ab44710b90d"
    }
  };
}
