/* @flow */

const _ = require("lodash");

function getEntityIdentity({
  hullEntity,
  sfEntity,
  resource,
  hullClient,
  source
}: {
  hullEntity: Object,
  sfEntity: Object,
  resource: string,
  hullClient: Object,
  source: string
}) {
  const userIdentityFields = ["id", "email", "external_id", "anonymous_ids"];
  const accountIdentityFields = [
    "id",
    "domain",
    "external_id",
    "anonymous_ids"
  ];

  let identity = {};
  let anonymous_id_prefix = source;
  if (resource === "Account") {
    identity = _.pick(hullEntity, accountIdentityFields);
  } else if (resource === "Lead" || resource === "Contact") {
    identity = _.pick(hullEntity, userIdentityFields);
    anonymous_id_prefix = `${source}-${_.toLower(resource)}`;
  }

  const anonymous_ids = _.get(identity, "anonymous_ids", []);
  const sfAnonIds = _.filter(anonymous_ids, anonymous_id => {
    return anonymous_id.startsWith(anonymous_id_prefix);
  });

  if (sfAnonIds.length > 1) {
    hullClient.logger.info(
      `Found entity [${anonymous_ids}] with multiple salesforce anonymous ids: ${sfAnonIds.length}`
    );
  }

  if (!_.isNil(_.get(sfEntity, "Id", null))) {
    _.set(
      identity,
      "anonymous_id",
      `${anonymous_id_prefix}:${_.get(sfEntity, "Id")}`
    );
  }

  return identity;
}

module.exports = {
  getEntityIdentity
};
