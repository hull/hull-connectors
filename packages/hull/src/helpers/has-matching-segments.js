// @flow
import _ from "lodash";
import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullEntityName
} from "hull";

type HasMatchingSegmentsParams = {
  matchOnBatch?: boolean,
  whitelist: Array<string>,
  blacklist: Array<string>,
  entity: HullEntityName
};

const hasMatchingSegments = (ctx: HullContext) => ({
  matchOnBatch = true,
  whitelist = [],
  blacklist = [],
  entity
}: HasMatchingSegmentsParams) => (
  message: HullUserUpdateMessage | HullAccountUpdateMessage
): boolean => {
  if (matchOnBatch && ctx.isBatch) {
    return true;
  }

  // TODO: Drive this from Manifest somehow
  // const { connector, connectorConfig } = ctx;
  // const { manifest } = connectorConfig;
  // const { whitelist: whitelistSource, blacklist: blacklistSource } = manifest;
  // const whitelist = _.get(connector, whitelistSource);
  // const blacklist = _.get(connector, blacklistSource);

  // $FlowFixMe
  const { user_segments = [], account_segments = [] } = message;
  const segmentIds = _.map(
    entity === "user" ? user_segments : account_segments,
    "id"
  );

  return (
    _.intersection(blacklist, segmentIds).length === 0 &&
    (_.intersection(whitelist, segmentIds).length > 0 ||
      _.includes(whitelist, "ALL"))
  );
};

module.exports = hasMatchingSegments;
