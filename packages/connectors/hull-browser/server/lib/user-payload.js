// @flow

import _ from "lodash";

import ga from "../destinations/google-analytics";

import type { Segments, Events, UserPayload, Payload } from "../../types";

/**
 * Build a User payload with the necessary objects to be sent client-side
 * @param  {Object} options.user     User attributes, Received from `user:update`
 * @param  {Object} options.segments User segments, Received from `user:update`
 * @param  {Object} options.client   Hull Client, scoped to current connector
 * @param  {Object} options.connector     Ship settings
 * @return {Object}                  The user payload, status code, and script to run client-side
 */
export default function userPayload({
  user,
  segments,
  account_segments,
  events,
  account,
  client,
  connector
}: UserPayload): Payload {
  const { private_settings, settings } = connector;

  const {
    public_traits = [],
    public_events = [],
    public_segments = [],
    public_account_segments = [],
    synchronized_segments = []
  } = private_settings;

  const segmentIds = _.map(segments, "id");

  // No Segment: Everyone goes there
  if (
    synchronized_segments.length &&
    !_.intersection(synchronized_segments, segmentIds).length
  ) {
    return { message: "private", user: { id: user.id }, segments: {} };
  }

  const u = client.utils.traits.group(
    _.pick(_.omit(user, "segments"), public_traits)
  );
  const response_user_segments: Segments = _.map(
    _.filter(segments, s => _.includes(public_segments, s.id)),
    "name"
  );
  const response_events: Events = _.map(
    _.filter(events, e => _.includes(public_events, e.event)),
    "event"
  );
  const response_account_segments: Segments = _.map(
    _.filter(account_segments, s => _.includes(public_account_segments, s.id)),
    "name"
  );

  return {
    message: "ok",
    user: { ...u, id: user.id },
    settings,
    destinations: {
      google_analytics: ga({ user, settings })
    },
    // workaround to use the traits that contain both account and user traits, and leave the account object separate
    account: _.pick(
      { account },
      _.filter(public_traits, t => t.indexOf("account.") === 0)
    ).account,
    events: response_events,
    public_user_segments: public_segments,
    public_account_segments,
    user_segments: response_user_segments,
    account_segments: response_account_segments
  };
}
