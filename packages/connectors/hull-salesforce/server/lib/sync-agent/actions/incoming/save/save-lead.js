/* @flow */

const _ = require("lodash");
const Promise = require("bluebird");

function saveLeadObject({ privateSettings, syncAgent, record, resourceSchema }: Object): Promise<*> {
  const hullClient = syncAgent.hullClient;
  const attributesMapper = syncAgent.attributesMapper;

  const traits = attributesMapper.mapToHullAttributeObject("Lead", record, resourceSchema);
  const userIdentity = attributesMapper.mapToHullIdentObject("Lead", record);
  const asLeadUser = hullClient.asUser(userIdentity);

  const requireEmail = _.get(privateSettings, "ignore_users_withoutemail", false);

  if (_.get(record, "Email", "n/a") === "n/a" && requireEmail) {
    return asLeadUser.logger.info("incoming.user.skip", { type: "Lead", reason: "User has no email address and is not identifiable." });
  }
  return asLeadUser
    .traits(traits)
    .then(() => {
      asLeadUser.logger.info("incoming.user.success", { traits });
    })
    .catch((error) => {
      asLeadUser.logger.error("incoming.user.error", { error });
    });
}

module.exports = {
  saveLeadObject
};
