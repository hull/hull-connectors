// @flow
import type { HullContext } from "hull";
import _ from "lodash";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> =>
  _.pick(
    ctx.connector.private_settings,
    "url",
    "sync_interval",
    "method",
    "format",
    "headers",
    "cookies",
    "body"
  );

export default configHandler;
