// @flow

import track from "./track";
import type { HullContext } from "hull";

export default async function handleScreen(ctx: HullContext, payload = {}) {
  const { connector = {} } = ctx;
  const { handle_screens } = connector.settings;

  if (handle_screens === false) {
    return false;
  }

  const { properties = {} } = payload;
  properties.name ??= payload.name;

  return track(ctx, {
    ...payload,
    properties,
    event: "screen",
    active: true
  });
}
