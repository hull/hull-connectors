// @flow

import type {
  HullEvent,
  // HullEntityType,
  HullUserClaims,
  HullAccountClaims
} from "./index";

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

export type HullGetEntityParams =
  | {
      claims: HullAccountClaims,
      entity: "account",
      per_page?: number,
      page?: number
    }
  | {
      claims: HullUserClaims,
      entity: "user",
      include?: HullIncludedEntities,
      per_page?: number,
      page?: number
    };

export type HullFetchedEvent = HullEvent;
