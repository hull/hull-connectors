// @flow

import track from './track';
import type { HullContext, SegmentIncomingScreen } from '../types';

export default function handleScreen(ctx: HullContext, message: SegmentIncomingScreen) {
const { connector, client } = ctx;
const { handle_screens } = connector.settings || {};
  if (handle_screens === false) {
    return false;
  }

  const { properties = {} } = message;

  const screen: SegmentIncomingScreen = {
    ...message,
    properties: {
      ...properties,
      name: properties.name || message.name
    },
    event: "screen",
    active: true
  };

  return track(ctx, screen);
}
