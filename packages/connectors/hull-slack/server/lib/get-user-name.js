//@noflow
module.exports = function getUserName({
  name,
  email,
  first_name,
  last_name,
} = {}) {
  return (
    name ||
    email ||
    [first_name, " ", last_name].join(" ").trim() ||
    "Unnamed User"
  );
};
