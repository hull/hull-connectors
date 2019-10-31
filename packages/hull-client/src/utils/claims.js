// @flow
import _ from "lodash";
import type { HullUser, HullAccount } from "../types";

export const getServiceId = (
  service: string,
  entity: HullUser | HullAccount
) => {
  const { anonymous_ids = [] } = entity;
  return _.find(anonymous_ids, v => v.indexOf(`${service}:`) === 0);
};

export const getFirstAnonymousId = (entity: HullUser | HullAccount) => {
  return _.first(entity.anonymous_ids);
};
