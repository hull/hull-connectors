// @flow

const uuidV4 = require("uuid/v4");

export default function formatBody(type: string, payload: {}): Object | null {
  if (!payload) {
    return null;
  }

  return {
    timestamp: new Date(),
    messageId: `node-${uuidV4()}`,
    ...payload,
    type,
    library: {
      name: "hull-connector",
      version: "1.0.0"
    },
    _metadata: {
      ...payload._metadata,
      nodeVersion: process.versions.node
    }
  };
}
