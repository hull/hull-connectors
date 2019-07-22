// @noflow
import _ from "lodash";
import getSanitizedChannel from "./get-sanitized-channels";

export default function getUniqueChannelNames(channels = []) {
  return channels.length
    ? _.map(_.compact(_.uniq(channels)), getSanitizedChannel)
    : [];
}
