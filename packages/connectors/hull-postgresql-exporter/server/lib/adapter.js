const _ = require("lodash");

export function getConnectionOptions({ private_settings }) {
  const {
    db_username: username,
    db_password: password,
    db_hostname: host,
    db_name: name,
    db_port: port
  } = private_settings;

  return {
    username,
    password,
    host,
    name,
    port,
    dialect: "postgres",
    dialectOptions: {
      ssl: true
    }
  };
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
