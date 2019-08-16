/* flow... */

const _ = require("lodash");

const { isUndefinedOrNull } = require("../utils");

const { oAuthHandler } = require("hull/src/handlers");
const {  } = require("./hubspot-oauth");
const { oauth2 } = require("./oauth2");

function createAuthHandler(manifest, serviceDefinitions) {
  const primaryService = _.find(serviceDefinitions, (service) => {
    return !_.isEmpty(service.authentication)
  });

  if (!isUndefinedOrNull(primaryService)) {
    const authentication = primaryService.authentication;

    if (authentication.strategy === "oauth2") {
      const params = _.cloneDeep(authentication.params);
      _.merge(params, oauth2);
      return oAuthHandler(params);
    } else if (authentication.strategy === "hubspotoauth") {
      const params = _.cloneDeep(authentication.params);
      _.merge(params, hubspotOAuth);
      return oAuthHandler(params);
    }
  }
  return null;
}

module.exports = {
  createAuthHandler
}
