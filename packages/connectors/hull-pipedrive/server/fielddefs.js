const orgFields = [
  {
    name: "name",
    display: "Name",
    readOnly: false
  },
  {
    name: "address",
    display: "Address",
    readOnly: false
  },
  {
    name: "people_count",
    display: "People count",
    readOnly: true
  },
  {
    name: "add_time",
    display: "Added at",
    readOnly: true
  }
];

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
    name: "email",
    display: "Emails",
    readOnly: false
  }
];

module.exports = {
  personFields,
  orgFields
};
