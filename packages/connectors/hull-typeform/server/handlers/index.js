// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import {
  authorization,
  refreshAccessToken,
  fetchAllResponses,
  fetchRecentResponses,
  getForms,
  getEmailQuestions,
  getQuestions
} from "../actions";

const handlers = ({ clientID, clientSecret}: { clientID: string, clientSecret: string}) => (connector: Connector): HullHandlersConfiguration => ({
  schedules: [
    {
      url: "/fetch",
      handler: {
        callback: fetchRecentResponses,
        options: {
          fireAndForget: true
        }
      }
    },
    {
      url: "/fetch-recent-responses",
      handler: {
        callback: fetchRecentResponses,
        options: {
          fireAndForget: true
        }
      }
    },
    {
      url: "/refresh-access-token",
      handler: {
        callback: refreshAccessToken,
        options: {
          fireAndForget: true
        }
      }
    },
  ],
  json: [
    {
      url: "/fetch-all-responses",
      handler: {
        callback: fetchAllResponses
      }
    },
    {
      url: "/schema/forms",
      handler: {
        callback: getForms
      }
    },
    {
      url: "/schema/fields/email",
      handler: {
        callback: getEmailQuestions
      }
    },
    {
      url: "/schema/fields",
      handler: {
        callback: getQuestions
      }
    },
    {
      url: "/admin",
      method: "all",
      handler: authorization({ clientID, clientSecret })
    }
  ]
  // ,
  // json: [
  // ],
  // schedules: [
  // ],
  // routers: [
  // ]
});

export default handlers;
