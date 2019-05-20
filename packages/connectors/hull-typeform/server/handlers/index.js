// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import {
  oauth,
  refreshAccessToken,
  fetchAllResponses,
  fetchRecentResponses,
  getForms,
  getEmailQuestions,
  getQuestions
} from "../actions";

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (_connector: Connector): HullHandlersConfiguration => ({
  schedules: { fetchRecentResponses, refreshAccessToken },
  credentials: {
    oauth: oauth({ clientID, clientSecret })
  },
  json: {
    fetchRecentResponses,
    fetchAllResponses,
    getForms,
    getEmailQuestions,
    getQuestions
  },
  tabs: { admin: oauth({ clientID, clientSecret }) }
});

export default handlers;
