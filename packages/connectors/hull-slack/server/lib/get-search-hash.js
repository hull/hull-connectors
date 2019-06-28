// @noflow

module.exports = function getSearchHash(type, message) {
  const search = {};
  const { matches = [] } = message;
  if (type === "email") {
    search.email = matches[3];
    if (matches[4]) search.rest = matches[4];
    return search;
  }

  if (type === "id") {
    search.id = matches[1];
    search.rest = matches[2];
  } else {
    search.name = matches[1];
  }
  return search;
};
