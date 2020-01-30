// @noflow
import _ from "lodash";
import getSanitizedChannel from "./get-sanitized-channels";

export default function getUniqueChannelNames(channels: Array<any> = []) {
  return channels.length
    ? _.map(_.compact(_.uniq(channels)), getSanitizedChannel)
    : [];
}
