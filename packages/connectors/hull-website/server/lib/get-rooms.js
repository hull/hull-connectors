// @flow

import _ from "lodash";
import type { HullUser } from "hull";

export default function getRooms(user: HullUser): Array<string> {
  if (!user || !_.size(user)) return [];
  return _.compact(
    _.filter(
      [
        ...(user.anonymous_ids || []),
        user.external_id,
        user.id,
        user.email,
        user.contact_email
      ],
      _.isString
    )
  );
}
