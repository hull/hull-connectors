//@flow

import type { HullEvent } from 'hull';
import type {
  SegmentOutgoingPayload,
  SegmentOutgoingPage,
  SegmentOutgoingTrack,
  SegmentOutgoingScreen,
  SegmentClient
} from '../types';

type Payload = {
  analytics: SegmentClient,
  anonymousId?: ?string,
  event: HullEvent,
  userId?: ?string,
  groupId?: ?string,
  integrations: {},
  traits: {}
};

module.exports = function({
  analytics,
  anonymousId,
  event,
  userId,
  groupId,
  traits,
  integrations
}: Payload): SegmentOutgoingPayload {
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

  const ctx = {
    ip,
    groupId,
    os: { ...os },
    page: { ...page, referrer: referrer_url },
    traits,
    location: { ...location },
    userAgent: useragent,
    active: true
  };
  const payload = {
    anonymousId: anonymous_id || anonymousId,
    messageId: event_id,
    timestamp: new Date(created_at),
    userId,
    properties,
    integrations,
    context: ctx
  };

  const type =
    eventName === 'page' || eventName === 'screen' ? eventName : 'track';

  //Page-specific formatting
  if (type === 'page') {
    const p = {
      ...ctx.page,
      ...properties
    };
    const ret: SegmentOutgoingPage = {
      ...payload,
      name: name.toString(),
      channel: 'browser',
      properties: p,
      context: {
        ...ctx,
        page: p
      }
    };
    analytics.page(ret);
    return ret;
  }

  //Screen-specific formatting
  if (type === 'screen') {
    const ret: SegmentOutgoingScreen = {
      ...payload,
      name: name.toString(),
      channel: 'mobile',
      properties
    };
    analytics.enqueue('screen', ret);
    return ret;
  }

  //Generic Track
  const ret: SegmentOutgoingTrack = {
    ...payload,
    event: eventName,
    category
  };
  analytics.track(ret);
  return ret;
};
