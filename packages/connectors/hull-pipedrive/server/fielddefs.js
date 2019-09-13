const organizationFields = [];

const personFields = [
  {
    name: "add_time",
    display: "Added At",
    readOnly: false
  },
  {
    name: "first_name",
    display: "First Name",
    readOnly: false
  },
  {
    name: "last_name",
    display: "Last Name",
    readOnly: false
  },
  {
    name: "email.value",
    display: "Email",
    readOnly: false,
    type: "array"
  }
];

module.exports = {
  personFields,
  organizationFields
};
