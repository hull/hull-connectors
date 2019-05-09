//@flow

import fp from "lodash/fp";
import type { HullEvent } from "hull";

export const getfirstNonNull: (?Array<string>) => ?string = fp.flow(
  fp.compact,
  fp.first
);

export const getFirstAnonymousIdFromEvents: (
  ?Array<HullEvent>
) => ?string = fp.flow(
  fp.map("anonymous_id"),
  getfirstNonNull
);
