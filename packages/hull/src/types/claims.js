// @flow

import type { HullEvent } from "./index";

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
  claims: {
    id?: string,
    external_id?: string,
    anonymous_id?: string,
    email?: string,
    domain?: string
  },
  service?: string,
  include?: HullIncludedEntities
};

export type HullFetchedEvent = HullEvent;
