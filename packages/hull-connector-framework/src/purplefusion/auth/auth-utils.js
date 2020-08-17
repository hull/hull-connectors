/* flow... */

const _ = require("lodash");

const { isUndefinedOrNull } = require("../utils");

const { hubspotOAuth } = require("./hubspot-oauth");
const { googleOAuth } = require("./google-oauth");
const { oauth2 } = require("./oauth2");

function getServiceOAuthParams(manifest, serviceDefinitions) {
  const primaryService = _.find(serviceDefinitions, (service) => {
    return !_.isEmpty(service.authentication)
  });

  if (!isUndefinedOrNull(primaryService) && primaryService.authentication) {
    const authentication = primaryService.authentication;
    const params = _.cloneDeep(authentication.params);
    if (authentication.strategy === "oauth2") {
      _.merge(params, oauth2);
    } else if (authentication.strategy === "hubspotoauth") {
      _.merge(params, hubspotOAuth);
    } else if (authentication.strategy === "googleoauth") {
      _.merge(params, googleOAuth);
    }
    return params;
  }
  return null;
}

module.exports = {
  getServiceOAuthParams
}
