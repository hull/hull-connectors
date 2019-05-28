// @noflow

export function getAccountName({ domain } = {}) {
  return domain || "Unnamed Account";
}

export function getUserName({ name, email, first_name, last_name } = {}) {
  return (
    name ||
    email ||
    [first_name, " ", last_name].join(" ").trim() ||
    "Unnamed User"
  );
}
