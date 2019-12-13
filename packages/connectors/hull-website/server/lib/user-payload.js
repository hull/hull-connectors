// @flow

import _ from "lodash";
import type { HullContext, HullFetchedUser } from "hull";

// import ga from "../destinations/ga";
// import gtm from "../destinations/gtm";

import type { Segments, Events, Payload } from "../../types";

/**
 * Build a User payload with the necessary objects to be sent client-side
 * @param  {Object} options.user     User attributes, Received from `user:update`
 * @param  {Object} options.segments User segments, Received from `user:update`
 * @param  {Object} options.client   Hull Client, scoped to current connector
 * @param  {Object} options.connector     Ship settings
 * @return {Object}                  The user payload, status code, and script to run client-side
 */
export default function userPayload(
  ctx: HullContext,
  message: HullFetchedUser
): Payload {
  const { user, segments, account_segments, events, account } = message;
  const { client, connector } = ctx;
  const { private_settings, settings } = connector;

  const {
    public_traits = [],
    public_events = [],
    public_segments = [],
    public_account_segments = []
  } = private_settings;

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
    // destinations: {
    //   ga: ga({ user, settings }),
    //   gtm: gtm({ user, settings })
    // },
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
