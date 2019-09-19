// @flow

import type { Destination, PublicUpdate } from "../../types";
// import { map } from "lodash";


// https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#customs

export default function googleanalytics(
  { userId }: Destination,
  {
    events
  }: // account,
  // user,
  // user_segments,
  // destinations
  PublicUpdate // changes, // settings = {}
) {
  if (window.ga) {
    if (userId) {
      window.ga("set", "userId", userId);
      if (!events.length) {
        window.ga("send", "event", "authentication", "user-id available");
      }
    }
    events.map(event => window.ga("send", event));
  }
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#customs
  // We don't support dimensions yet
  // Hull.alias(`ga:${tracker.get('clientId')}`);
}
