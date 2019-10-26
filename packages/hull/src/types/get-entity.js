// @flow

import type { HullEvent, HullEntityName, HullEntityClaims } from "./index";

export type HullIncludedEvents = {
  names?: Array<string>,
  per_page?: number,
  page?: number
};

export type HullIncludedEntities = {
  events?: boolean | HullIncludedEvents,
  account?: boolean,
  users?: boolean
};

export type HullGetEntityParams = {
  claims?: HullEntityClaims,
  search?: string,
  entity: HullEntityName,
  include?: HullIncludedEntities,
  per_page?: number,
  page?: number
};

export type HullFetchedEvent = HullEvent;
