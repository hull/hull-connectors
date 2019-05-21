// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import {
  onAuthorize,
  status,
  credentialsStatus,
  refreshAccessToken,
  fetchAllResponses,
  fetchRecentResponses,
  getForms,
  getEmailQuestions,
  getQuestions
} from "../actions";

const Strategy = require("passport-typeform").Strategy;

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (_connector: Connector): HullHandlersConfiguration => ({
  schedules: { fetchRecentResponses, refreshAccessToken },
  json: {
    fetchRecentResponses,
    fetchAllResponses,
    getForms,
    getEmailQuestions,
    getQuestions,
    credentialsStatus
  },
  statuses: {
    status
  },
  private_settings: {
    oauth: () => ({
      onAuthorize,
      Strategy,
      clientID,
      clientSecret
    })
  }
});

export default handlers;
