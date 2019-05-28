// @noflow

export function getAccountName({ domain } = {}) {
  return domain || "Unnamed User";
}

export function getUserName({
  name,
  domain,
  email,
  first_name,
  last_name
} = {}) {
  return `${name ||
    email ||
    [first_name, " ", last_name].join(" ").trim() ||
    "Unnamed User"} ${getAccountName({ domain })}`;
}
