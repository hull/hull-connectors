// @flow
import type { HullHandlersConfiguration } from "hull";

import onAuthorize from "../actions/on-authorize";
import onStatus from "../actions/on-status";
import status from "../actions/status";
import fetchAllResponses from "../actions/fetch-all-responses";
import getForms from "../actions/get-forms";
import getQuestions from "../actions/get-questions";
import getEmailQuestions from "../actions/get-email-questions";
import refreshAccessToken from "../actions/refresh-access-token";
import fetchRecentResponses from "../actions/fetch-recent-responses";

const Strategy = require("passport-typeform").Strategy;

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullHandlersConfiguration => ({
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
