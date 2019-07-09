// @flow

import type { HullEntityType, HullEvent } from "./index";

export type HullIncludedEvents = {
  names?: Array<string>,
  per_page?: number,
  page?: number
};

export type HullIncludedEntities = {
  events?: HullIncludedEvents,
  account?: boolean,
  users?: boolean
};

export type HullEntityClaims = {
  claims: string,
  claimType: HullEntityType,
  service?: string,
  include?: HullIncludedEntities
};

export type HullFetchedEvent = HullEvent;
