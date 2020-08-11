// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    QUEUE_NAME = "queueApp",
    COMBINED,
    SERVER,
    WORKER,
    MAILCHIMP_CLIENT_ID,
    MAILCHIMP_CLIENT_SECRET
  } = process.env;

  if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
    throw new Error(
      "None of the processes were started, set any of COMBINED, SERVER or WORKER env vars"
    );
  }

  if (!MAILCHIMP_CLIENT_ID || !MAILCHIMP_CLIENT_SECRET) {
    throw new Error(
      "Can't find Mailchimp Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: handlers({
      clientID: MAILCHIMP_CLIENT_ID,
      clientSecret: MAILCHIMP_CLIENT_SECRET
    }),
    serverConfig: {
      start: COMBINED === "true" || SERVER === "true"
    },
    workerConfig: {
      start: COMBINED === "true" || WORKER === "true",
      queueName: QUEUE_NAME || "queue"
    }
  };
}
