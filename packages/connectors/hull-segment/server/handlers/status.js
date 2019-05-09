// @flow

import _ from "lodash";
import type { HullSendResponse } from "hull";
import type { HullContext } from "../types";

module.exports = function statusCheck(ctx: HullContext): HullSendResponse {
  const { connector = {} } = ctx;
  const { private_settings, settings } = connector;
  if (!connector) {
    return Promise.resolve({
      status: "error",
      message: "Invalid credentials passed"
    });
  }
  const messages = [];
  let status = "ok";
  const {
    write_key,
    handle_pages,
    handle_accounts,
    ignore_segment_userId,
    public_id_field,
    public_account_id_field
  } = settings;
  const {
    send_events,
    synchronized_account_properties,
    synchronized_properties,
    synchronized_account_segments,
    synchronized_segments
  } = private_settings;

  if (!write_key && _.size(synchronized_segments)) {
    status = "warning";
    messages.push(
      "Some segments are listed but there's no write key. Can't send anything."
    );
  }

  if (write_key && !_.size(synchronized_segments)) {
    status = "warning";
    messages.push(
      "We have a write key but no segments are listed. Nothing will go out"
    );
  }

  if (
    write_key &&
    (!_.size(synchronized_properties) &&
      !_.size(synchronized_account_properties) &&
      !_.size(send_events))
  ) {
    status = "warning";
    messages.push(
      "We have a write key but no attributes and no events are listed. Nothing will go out."
    );
  }

  if (_.size(synchronized_segments) && !_.size(synchronized_properties)) {
    status = "warning";
    messages.push(
      "Some segments are listed to send, but no properties are listed. Profiles will probably be incomplete"
    );
  }

  if (
    _.size(synchronized_account_segments) &&
    !_.size(synchronized_account_properties)
  ) {
    status = "warning";
    messages.push(
      "Some account segments are listed to send, but no account properties are listed. Profiles will probably be incomplete"
    );
  }

  if (public_id_field !== "external_id") {
    status = "warning";
    messages.push(
      "You're not using `external_id` as the main identifier sent to Segment.com for a User. It works but it's usually an advanced option. Keep it in mind when debugging"
    );
  }

  if (ignore_segment_userId) {
    status = "warning";
    messages.push(
      "You are ignoring ALL User IDs coming from Segment for this connector. It's an advanced option. Keep this in mind"
    );
  }

  if (public_account_id_field !== "external_id") {
    status = "warning";
    messages.push(
      "You're not using `external_id` as the main identifier sent to Segment.com for an Account. It works but it's usually an advanced option. Keep it in mind when debugging"
    );
  }

  if (!handle_pages) {
    status = "warning";
    messages.push(
      "You have disabled support for collecting Page views. Keep in mind it will track incomplete profiles"
    );
  }

  if (!handle_accounts) {
    status = "warning";
    messages.push(
      "You have disabled support for Accounts coming In and Out of this connector. Keep this in mind when debugging"
    );
  }

  // return client.put(`${connector.id}/status`, { status, messages });
  return Promise.resolve({ messages, status });
};
