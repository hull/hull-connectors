// @flow

import type { HullEvent } from "hull";
import type {
  SegmentOutgoingPayload,
  SegmentOutgoingPage,
  SegmentOutgoingTrack,
  SegmentOutgoingScreen,
  SegmentClient
} from "../types";

const integrations = { Hull: false };

type Payload = {
  active?: boolean,
  analytics: SegmentClient,
  anonymousId?: ?string,
  event: HullEvent,
  userId?: ?string,
  groupId?: ?string,
  traits: {}
};

module.exports = async function segmentEvent({
  analytics,
  anonymousId,
  event,
  userId,
  groupId,
  active = true,
  traits
}: Payload): Promise<SegmentOutgoingPayload> {
  const {
    created_at,
    event_id,
    anonymous_id,
    event: eventName,
    properties,
    context
  } = event;
  const { name, category } = properties || {};

  const { location, page, referrer, os, useragent, ip = 0 } = context || {};

  const { url: referrer_url } = referrer || {};

  const segmentContext = {
    ip,
    active,
    groupId,
    os: { ...os },
    page: { ...page, referrer: referrer_url },
    traits,
    location: { ...location },
    userAgent: useragent
  };
  const payload = {
    anonymousId: anonymous_id || anonymousId,
    messageId: event_id,
    timestamp: new Date(created_at),
    userId,
    properties,
    integrations,
    context: segmentContext
  };

  const type =
    eventName === "page" || eventName === "screen" ? eventName : "track";

  // Page-specific formatting
  if (type === "page") {
    const p = {
      ...segmentContext.page,
      ...properties
    };
    const ret: SegmentOutgoingPage = {
      ...payload,
      name: name.toString(),
      channel: "browser",
      properties: p,
      context: {
        ...segmentContext,
        page: p
      }
    };
    analytics.page(ret);
    return ret;
  }

  // Screen-specific formatting
  if (type === "screen") {
    const ret: SegmentOutgoingScreen = {
      ...payload,
      name: name.toString(),
      channel: "mobile",
      properties
    };
    analytics.enqueue("screen", ret);
    return ret;
  }

  // Generic Track
  const ret: SegmentOutgoingTrack = {
    ...payload,
    event: eventName,
    category
  };
  await analytics.track(ret);
  return ret;
};
