// @flow

import { reduce } from 'lodash';
import scoped from '../scope-hull-client';
import type { HullContext, SegmentIncomingTrack, SegmentIncomingPage, SegmentIncomingScreen } from '../types';

export default function handleTrack(
  { connector, metric, client }: HullContext,
  message: SegmentIncomingTrack | SegmentIncomingPage | SegmentIncomingScreen
) {
  const {
    context = {},
    anonymousId,
    active,
    event,
    properties,
    userId,
    timestamp,
    originalTimestamp,
    sentAt,
    receivedAt,
    integrations = {}
  } = message;

  const { page = {}, location = {}, userAgent, ip = '0' } = context;
  const { url, referrer } = page;
  const { latitude, longitude } = location;

  const created_at = timestamp || receivedAt || sentAt || originalTimestamp;

  const _bid = anonymousId || userId;
  let _sid = (created_at || new Date().toISOString()).substring(0, 10);

  if (_bid) {
    _sid = [_bid, _sid].join('-');
  }

  const trackContext = reduce(
    {
      source: 'segment',
      created_at,
      _bid,
      _sid,
      url,
      referrer,
      useragent: userAgent,
      ip,
      latitude,
      longitude,
      active: active || context.active
    },
    (p, v, k) => {
      if (v !== undefined) {
        p[k] = v;
      }
      return p;
    },
    {}
  );

  const useHullId = integrations.Hull && integrations.Hull.id === true;

  const asUser = scoped(client, message, useHullId, connector.settings, {});
  try {
    if (!event) {
      throw new Error("Event name is empty, can't track!");
    }
    return asUser.track(event, properties, trackContext).then(result => {
      asUser.logger.info('incoming.track.success', {
        trackContext,
        event,
        properties
      });
      return result;
    });
  } catch (err) {
    metric.increment('request.track.error');
    client.logger.error('incoming.track.error', { errors: message });
    return Promise.reject();
  }
}
