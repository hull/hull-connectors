// @flow
import type { HullContext } from "hull";
import _ from "lodash";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> =>
  _.pick(ctx.connector.private_settings, "id", "api_key", "sync_interval");

export default configHandler;
