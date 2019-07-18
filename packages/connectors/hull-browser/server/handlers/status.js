// @flow
import type { HullContext, HullStatusResponse } from "hull";
import type { Store } from "../../types";

export default function statusCheckFactory({ store }: { store: Store }) {
  const { get, pool, lru } = store;
  return async function statusCheck(ctx: HullContext): HullStatusResponse {
    const { connector } = ctx;
    const { id } = connector;
    let status = "ok";
    const messages = [];
    try {
      await get(id);
    } catch (e) {
      messages.push("Connector Cache empty");
    }
    if (!pool[id]) messages.push("No Connector Socket active");
    if (!lru[id]) messages.push("Empty Recent user list");
    if (messages.length) status = "error";
    // @TODO: Do we still need this if we're responding to the server ?
    return { status, messages };
  };
}
