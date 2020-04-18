export function getSshTunnelConfig({ ssh_port, ssh_username, ssh_private_key, ssh_host }) {
  return {
    port: ssh_port || 22,
    host: ssh_host,
    user: ssh_username,
    privateKey: ssh_private_key
  };
}

export function getDatabaseConfig({ db_hostname, db_port, db_name, db_user, db_password }) {
  return {
    host: db_hostname,
    port: db_port,
    user: db_user,
    password: db_password,
    database: db_name,

  };
}
