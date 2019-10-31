import prospect from "./prospect.json";

export default function(expect) {
  return {
    "clearbit/familyName": "Ward",
    "clearbit/fullName": "Harlow Ward",
    "clearbit/givenName": "Harlow",
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
