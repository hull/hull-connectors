// @flow

export default function getSanitizedChannel(channel) {
  return channel
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "_")
    .substring(0, 21);
}
