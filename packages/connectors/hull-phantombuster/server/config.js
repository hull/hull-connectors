// @flow

import type { HullConnectorConfig } from "hull";
import { entryModel } from "hull-vm";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    MONGO_URL,
    MONGO_COLLECTION_NAME = "phantombuster_requests"
  } = process.env;

  if (!MONGO_COLLECTION_NAME || !MONGO_URL) {
    throw new Error("One or more MongoDB Environment variables not set.");
  }

  // Mongo connection setup
  const EntryModel = entryModel({
    mongoUrl: MONGO_URL,
    collectionName: MONGO_COLLECTION_NAME
  });

  return {
        handlers: handlers({ EntryModel }),
    timeout: 25000,
    httpClientConfig: {
      prefix: "https://api.phantombuster.com/api/v2"
    }
  };
}
