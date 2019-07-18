// @noflow
module.exports = str =>
  str
    .replace(/_/g, " ")
    .trim()
    .replace(/\b[A-Z][a-z]+\b/g, word => word.toLowerCase())
    .replace(/^[a-z]/g, first => first.toUpperCase())
    .replace("Platforms/", "");
