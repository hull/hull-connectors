const _ = require("lodash");

// eslint-disable-next-line no-unused-vars
export function getConnectionString({ private_settings }) {
  // TODO
  return "";
}

export function isValidConfiguration({ private_settings }) {
  const requiredFields = [
    "db_username",
    "db_password",
    "db_hostname",
    "db_name",
    "db_port"
  ];
  return _.every(requiredFields, requiredField => {
    return !_.isNil(private_settings[requiredField]);
  });
}
