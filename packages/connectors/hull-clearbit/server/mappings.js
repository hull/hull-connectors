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
    subRole: "clearbit/employment_sub_role",
    seniority: "clearbit/employment_seniority",
    title: "clearbit/employment_title",
    verified: "clearbit/verified"
  }
};
