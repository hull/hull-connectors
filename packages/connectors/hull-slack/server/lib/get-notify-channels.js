// @noflow
import _ from "lodash";

export default function getSlackChannels(ship = {}) {
  const { private_settings = {} } = ship;
  if (!private_settings) return [];

  const { notify_events = [], notify_segments = [] } = private_settings;
  if (!notify_events && !notify_segments) return [];

  return _.map(_.concat(notify_segments, notify_events), "channel");
}
