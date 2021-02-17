// @flow

import type { HullContext } from "hull";

import _ from "lodash";
import scoped from "../lib/scope-hull-client";

export default async function handleTrack(ctx: HullContext, payload = {}) {
  const {
    context = {},
    active,
    anonymousId,
    event,
    properties,
    userId,
    timestamp,
    originalTimestamp,
    sentAt,
    receivedAt,
    messageId,
    integrations = {}
  } = payload;

  const { metric } = ctx;
  const { page = {}, location = {}, userAgent, ip = "0" } = context;
  const { url, referrer } = page;
  const { latitude, longitude } = location;
  const created_at = timestamp || receivedAt || sentAt || originalTimestamp;
  const _bid = anonymousId || userId;
  let _sid = (created_at || new Date().toISOString()).substring(0, 10);
  if (_bid) {
    _sid = [_bid, _sid].join("-");
  }

  // console.log("----",messageId:);
  const trackContext = _.reduce(
    {
      source: "segment",
      event_id: messageId,
      created_at,
      _bid,
      _sid,
      url,
      referer: referrer,
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

  if (integrations?.Hull?.id === true) {
    payload.hullId = payload.userId;
    delete payload.userId;
  }

  const asUser = scoped(ctx, payload);
  try {
    const result = await asUser.track(event, properties, trackContext);
    // asUser.logger.debug("incoming.track.success", {
    //   payload,
    //   trackContext,
    //   event,
    //   properties
    // });
    return result;
  } catch (error) {
    metric.increment("request.track.error");
    asUser.logger.error(
      `incoming.${
        event === "screen" || event === "page" ? event : "track"
      }.error`,
      {
        payload,
        errors: error
      }
    );
    throw error;
  }
}
