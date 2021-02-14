import { reduce } from "lodash";
import scoped from "../scope-hull-client";

export default function handleTrack(payload, { hull, metric, ship }) {
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
    integrations = {}
  } = payload;

  const { page = {}, location = {}, userAgent, ip = "0" } = context;
  const { url, referrer } = page;
  const { latitude, longitude } = location;

  const created_at = timestamp || receivedAt || sentAt || originalTimestamp;

  const _bid = anonymousId || userId;
  let _sid = (created_at || new Date().toISOString()).substring(0, 10);

  if (_bid) {
    _sid = [_bid, _sid].join("-");
  }

  const trackContext = reduce(
    {
      source: "segment",
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

  if (integrations.Hull && integrations.Hull.id === true) {
    payload.hullId = payload.userId;
    delete payload.userId;
  }

  const scopedUser = scoped(hull, payload, ship.settings);
  return scopedUser.track(event, properties, trackContext).then(
    (result) => {
      scopedUser.logger.debug("incoming.track.success", {
        payload,
        trackContext,
        event,
        properties
      });
      return result;
    },
    (message) => {
      metric("request.track.error");
      scopedUser.logger.error("incoming.track.error", { payload, errors: message });
      return Promise.reject();
    }
  );
}
