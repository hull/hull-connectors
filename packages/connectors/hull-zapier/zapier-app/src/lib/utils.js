const _ = require("lodash");

const isValidClaims = (claims) => _.some(claims, v => !!v);

module.exports = {
  isValidClaims
};
