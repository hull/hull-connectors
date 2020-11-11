// @flow

import type { HullConnectorConfig } from "hull";

import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET } = process.env;

  if (!MAILCHIMP_CLIENT_ID || !MAILCHIMP_CLIENT_SECRET) {
    throw new Error(
      "Can't find Mailchimp Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    handlers: handlers({
      clientID: MAILCHIMP_CLIENT_ID,
      clientSecret: MAILCHIMP_CLIENT_SECRET
    })
  };
}
