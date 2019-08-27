/* flow... */

const _ = require("lodash");

const { isUndefinedOrNull } = require("../utils");

const { oAuthHandler } = require("hull/src/handlers");
const {  } = require("./hubspot-oauth");
const { oauth2 } = require("./oauth2");

function getServiceOAuthParams(manifest, serviceDefinitions) {
  const primaryService = _.find(serviceDefinitions, (service) => {
    return !_.isEmpty(service.authentication)
  });

  if (!isUndefinedOrNull(primaryService) && primaryService.authentication) {
    const authentication = primaryService.authentication;
    return _.cloneDeep(authentication.params);
    // if (authentication.strategy === "oauth2") {
    //   return _.cloneDeep(authentication.params);
    // } else if (authentication.strategy === "hubspotoauth") {
    //   return _.cloneDeep(authentication.params);
    // }
  }
  return null;
}

module.exports = {
  getServiceOAuthParams
}
