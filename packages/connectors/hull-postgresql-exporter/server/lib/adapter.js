const _ = require("lodash");

export function getConnectionString({ private_settings }) {
  const dbType = "postgres";
  const {
    db_username: username,
    db_password: password,
    db_hostname: hostname,
    db_name: name,
    db_port: port
  } = private_settings;

  return `${dbType}://${username}:${password}@${hostname}:${port}/${name}?ssl=true`;
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
