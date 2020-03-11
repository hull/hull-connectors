// @flow

import type { HullConnectorConfig } from "hull";
import { entryModel } from "hull-vm";
import manifest from "../manifest.json";
import fetchToken from "./lib/fetch-token";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    MONGO_URL,
    MONGO_COLLECTION_NAME = "webhook_requests"
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
    manifest,
    handlers: handlers({ EntryModel }),
    middlewares: [fetchToken]
  };
}
