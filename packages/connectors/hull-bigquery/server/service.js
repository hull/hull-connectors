import type { RawRestApi } from "hull-connector-framework/src/purplefusion/types";
import { SuperagentApi } from "hull-connector-framework/src/purplefusion/superagent-api";

const OAuth2Strategy = require("passport-google-oauth20").Strategy;
const service = ({clientID, clientSecret}: {
  clientId: string,
  clientSecret: string
}) : RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://bigquery.googleapis.com",
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" }},
      { method: "set", params: { Authorization: "Bearer ${connector.private_settings.access_token}" }}
    ]
  },
  authentication: {
    strategy: "googleoauth",
    params: {
      Strategy: OAuth2Strategy,
      clientID,
      clientSecret
    }
  }
});

module.exports = service;
