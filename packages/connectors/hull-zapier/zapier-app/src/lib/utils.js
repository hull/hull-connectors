const _ = require("lodash");

const DOMAIN_REGEX = "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\\.[a-zA-Z]{2,})+$";
const EMAIL_REGEX = "(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])";

function matches(value, regex) {
  if (!_.isNil(value)) {
    const regexMatches = value.match(new RegExp(`^${regex}$`));
    return !_.isNil(regexMatches);
  }
  return false;
}
function isValidClaim(claims) {
  const { external_id, email, domain } = claims;

  if (_.isNil(email) && _.isNil(domain)) {
    return !_.isNil(external_id);
  }

  // can have either email or domain, but not both
  const isValidEmail = !_.isNil(email) && matches(email, EMAIL_REGEX);
  const isValidDomain = !_.isNil(domain) && matches(domain, DOMAIN_REGEX);

  return isValidEmail || isValidDomain;
}

module.exports = {
  isValidClaim
};
