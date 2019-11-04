import prospect from "./prospect.json";

export default function(expect) {
  return {
    "clearbit/first_name": "Harlow",
    "clearbit/last_name": "Ward",
    "clearbit/full_name": "Harlow Ward",

    "clearbit/email": "harlow@clearbit.com",
    "clearbit/phone": "+1 415-555-1212",
    "clearbit/employment_role": "leadership",
    "clearbit/employment_sub_role": "founder",
    "clearbit/employment_seniority": "executive",
    "clearbit/employment_title": "Co Founder at Clearbit",
    "clearbit/verified": true,
    "clearbit/company_name": "Clearbit",

    "clearbit/prospect_id": "7416592A-A0D5-4AE5-ACB0-03156E444E9C",
    "clearbit/prospected_at": {
      operation: "setIfNull",
      value: expect.whatever()
    },
    "clearbit/source": {
      operation: "setIfNull",
      value: "prospector"
    },
    email: {
      operation: "setIfNull",
      value: "harlow@clearbit.com"
    },
    first_name: {
      operation: "setIfNull",
      value: "Harlow"
    },
    last_name: {
      operation: "setIfNull",
      value: "Ward"
    },
    phone: {
      operation: "setIfNull",
      value: "+1 415-555-1212"
    }
  };
}
