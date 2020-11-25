// @flow
import type { HullHandlersConfiguration } from "hull";

import dropcontactAttributesHandler from "./dropcontact-attributes";
import statusHandler from "./status-handler";
import enrich from "../jobs/enrich";
import userUpdate from "./user-update";

export default function handlers({
  flow_in,
  flow_size,
  flow_in_time
}: {
  flow_in: number,
  flow_size: number,
  flow_in_time: number
}): HullHandlersConfiguration {
  return {
    jobs: { enrich },
    statuses: { statusHandler },
    subscriptions: {
      userUpdate: userUpdate({ flow_in, flow_size, flow_in_time })
    },
    private_settings: { dropcontactAttributesHandler }
  };
}
