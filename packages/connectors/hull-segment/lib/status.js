"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = statusCheck;

var _lodash = _interopRequireDefault(require("lodash"));

function statusCheck(req, res) {
  const _req$hull = req.hull,
        ship = _req$hull.ship,
        client = _req$hull.client;
  const private_settings = ship.private_settings,
        settings = ship.settings;
  const messages = [];
  let status = "ok";
  const write_key = settings.write_key,
        handle_pages = settings.handle_pages,
        handle_accounts = settings.handle_accounts,
        ignore_segment_userId = settings.ignore_segment_userId,
        public_id_field = settings.public_id_field,
        public_account_id_field = settings.public_account_id_field;
  const send_events = private_settings.send_events,
        synchronized_account_properties = private_settings.synchronized_account_properties,
        synchronized_properties = private_settings.synchronized_properties,
        synchronized_segments = private_settings.synchronized_segments;

  if (!write_key && _lodash.default.size(synchronized_segments)) {
    status = "warning";
    messages.push("An outgoing user segments are configured but there's no Segment.com write key. We can't send anything out. Please refer to connector documentation to see where to get write key from.");
  } // adding this back in, because now it is true.


  if (write_key && !_lodash.default.size(synchronized_segments)) {
    status = "warning";
    messages.push("A Segment.com write key is configured but no outgoing user segments are listed. We won’t send anything out. If you don’t want to do outgoing traffic with this connector remove the write key, otherwise please add some outgoing user segments.");
  }

  if (write_key && !_lodash.default.size(synchronized_properties) && !_lodash.default.size(synchronized_account_properties) && !_lodash.default.size(send_events)) {
    status = "warning";
    messages.push("We have a write key but no attributes and no events are listed. Only ids and hull_segments are sent");
  }

  if (_lodash.default.size(synchronized_segments) && !_lodash.default.size(synchronized_properties) && !_lodash.default.size(synchronized_account_properties)) {
    status = "ok";
    messages.push("Some outgoing user segments are listed to send, but no properties are listed. Segment.com Profiles will probably be incomplete, please refer to connector settings to see how to setup outgoing properties.");
  }

  if (public_id_field !== "external_id") {
    status = "ok";
    messages.push("You're not using `external_id` as the main identifier sent to Segment.com for a User. It works but it's usually an advanced option. Keep it in mind when debugging");
  }

  if (ignore_segment_userId) {
    status = "ok";
    messages.push("You are ignoring ALL User IDs coming from Segment for this connector. It's an advanced option. Keep this in mind");
  }

  if (public_account_id_field !== "external_id") {
    status = "ok";
    messages.push("You're not using `external_id` as the main identifier sent to Segment.com for an Account. It works but it's usually an advanced option. Keep it in mind when debugging");
  }

  if (!handle_pages) {
    status = "ok";
    messages.push("You have disabled support for collecting Page views. Keep in mind it will track incomplete profiles");
  }

  if (!handle_accounts) {
    status = "ok";
    messages.push("You have disabled support for Accounts coming In and Out of this connector. Keep this in mind when debugging");
  }

  res.json({
    messages,
    status
  });
  return client.put(`${req.hull.ship.id}/status`, {
    status,
    messages
  });
}