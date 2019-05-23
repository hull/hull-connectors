// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import {
  onAuthorize,
  onStatus,
  status,
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
    getQuestions
  },
  statuses: {
    status
  },
  private_settings: {
    oauth: () => ({
      onAuthorize,
      onStatus,
      Strategy,
      clientID,
      clientSecret
    })
  }
});

export default handlers;
