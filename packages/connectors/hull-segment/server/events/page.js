// @flow

import type { HullContext } from "hull";
import track from "./track";
import type { SegmentIncomingPage } from "../types";

export default function handlePage(
  ctx: HullContext,
  message: SegmentIncomingPage
) {
  const { connector /* , client */ } = ctx;
  const { handle_pages } = connector.settings || {};
  if (handle_pages === false) {
    return false;
  }

  const { properties = {} } = message;

  const name = properties.name || message.name;
  const page: SegmentIncomingPage = {
    ...message,
    properties: {
      ...properties,
      ...(name ? { name } : {})
    },
    event: "page",
    active: true
  };

  return track(ctx, page);
}
