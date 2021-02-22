// @flow

import type { HullContext } from "hull";
import track from "./track";

export default async function handlePage(ctx: HullContext, payload = {}) {
  const { connector = {} } = ctx;
  const { handle_pages } = connector.settings;

  if (handle_pages === false) {
    return false;
  }

  const { properties = {} } = payload;
  properties.name ??= payload.name;

  return track(ctx, {
    ...payload,
    properties,
    event: "page",
    active: true
  });
}
