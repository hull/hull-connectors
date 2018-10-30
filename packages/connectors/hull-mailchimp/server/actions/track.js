/* @flow */
import type { HullContext } from "hull";

function track(ctx: HullContext) {
  return ctx.enqueue("track");
}

module.exports = track;
