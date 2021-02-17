/* @flow */
import type { HullContext } from "hull/src/types/context";
import updateUser from "../lib/user-update";

function refetchDomainInfo(ctx: HullContext, { message, attempt }) {
  return updateUser(ctx, [message], { queued: true, attempt: attempt + 1 });
}

module.exports = refetchDomainInfo;
