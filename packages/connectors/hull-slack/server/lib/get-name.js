// @noflow
export function getUserName({ name, email, first_name, last_name } = {}) {
  return (
    name ||
    email ||
    [first_name, " ", last_name].join(" ").trim() ||
    "Unnamed User"
  );
}

export function getAccountName({ domain } = {}) {
  return domain || "Unnamed User";
}
