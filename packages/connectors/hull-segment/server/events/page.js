// @flow

import track from "./track";
import type { HullContext, SegmentIncomingPage } from "../types";

export default function handlePage(
  ctx: HullContext,
  message: SegmentIncomingPage
) {
  const { connector, client } = ctx;
  const { handle_pages } = connector.settings || {};
  if (handle_pages === false) {
    return false;
  }

  const { properties = {} } = message;

  const page: SegmentIncomingPage = {
    ...message,
    properties: {
      ...properties,
      name: properties.name || message.name
    },
    event: "page",
    active: true
  };

  return track(ctx, page);
}
