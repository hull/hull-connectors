"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handleTrack;

var _lodash = require("lodash");

var _scopeHullClient = _interopRequireDefault(require("../scope-hull-client"));

function handleTrack(payload, {
  hull,
  metric,
  ship
}) {
  const _payload$context = payload.context,
        context = _payload$context === void 0 ? {} : _payload$context,
        active = payload.active,
        anonymousId = payload.anonymousId,
        event = payload.event,
        properties = payload.properties,
        userId = payload.userId,
        timestamp = payload.timestamp,
        originalTimestamp = payload.originalTimestamp,
        sentAt = payload.sentAt,
        receivedAt = payload.receivedAt,
        _payload$integrations = payload.integrations,
        integrations = _payload$integrations === void 0 ? {} : _payload$integrations;
  const _context$page = context.page,
        page = _context$page === void 0 ? {} : _context$page,
        _context$location = context.location,
        location = _context$location === void 0 ? {} : _context$location,
        userAgent = context.userAgent,
        _context$ip = context.ip,
        ip = _context$ip === void 0 ? "0" : _context$ip;
  const url = page.url,
        referrer = page.referrer;
  const latitude = location.latitude,
        longitude = location.longitude;
  const created_at = timestamp || receivedAt || sentAt || originalTimestamp;

  const _bid = anonymousId || userId;

  let _sid = (created_at || new Date().toISOString()).substring(0, 10);

  if (_bid) {
    _sid = [_bid, _sid].join("-");
  }

  const trackContext = (0, _lodash.reduce)({
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
  }, (p, v, k) => {
    if (v !== undefined) {
      p[k] = v;
    }

    return p;
  }, {});

  if (integrations.Hull && integrations.Hull.id === true) {
    payload.hullId = payload.userId;
    delete payload.userId;
  }

  const scopedUser = (0, _scopeHullClient.default)(hull, payload, ship.settings);
  return scopedUser.track(event, properties, trackContext).then(result => {
    scopedUser.logger.debug("incoming.track.success", {
      payload,
      trackContext,
      event,
      properties
    });
    return result;
  }, message => {
    metric("request.track.error");
    scopedUser.logger.error("incoming.track.error", {
      payload,
      errors: message
    });
    return Promise.reject();
  });
}