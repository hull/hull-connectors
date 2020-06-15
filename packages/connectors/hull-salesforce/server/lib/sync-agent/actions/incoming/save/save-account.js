/* @flow */

const Promise = require("bluebird");

function saveAccountObject({ syncAgent, record, resourceSchema }: Object): Promise<*> {
  const hullClient = syncAgent.hullClient;
  const attributesMapper = syncAgent.attributesMapper;

  const traits = attributesMapper.mapToHullAttributeObject("Account", record, resourceSchema);
  const asAccount = hullClient
    .asAccount(attributesMapper.mapToHullIdentObject("Account", record));
  return asAccount
    .traits(traits)
    .then(() => {
      asAccount.logger.info("incoming.account.success", { traits });
    })
    .catch((error) => {
      asAccount.logger.error("incoming.account.error", { error });
    });
}

module.exports = {
  saveAccountObject
};
