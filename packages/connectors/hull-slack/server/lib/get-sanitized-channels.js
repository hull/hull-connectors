// @flow

export default function getSanitizedChannel(channel: string) {
  return channel
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "_")
    .substring(0, 21);
}
