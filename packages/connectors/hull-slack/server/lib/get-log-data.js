//@noflow
import _ from "lodash";

export default function getMessageLogData(message = {}) {
  return _.pick(message, "team", "user", "channel", "event");
}
