// @flow
import type { HullContext } from "hull";

export default function checkConfig(ctx: HullContext) {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { agent_id, api_key } = private_settings;
  // Set Headers
  if (!api_key) {
    throw new Error(
      "No API Key defined, checkout https://support.phantombuster.com/hc/en-001/articles/360010229440-How-to-find-my-API-key"
    );
  }
  if (!agent_id) {
    throw new Error(
      "No Phantom ID defined. Please enter an Phantom ID. Visit the Phantom in Phantombuster and copy the Identifier in the URL: `https://phantombuster.com/xxx/phantoms/PHANTOM_ID_IS_HERE`"
    );
  }
}
