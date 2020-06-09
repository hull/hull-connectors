/* @flow */
import type {
  RawRestApi,
  EndpointType,
  RequestType
} from "hull-connector-framework/src/purplefusion/types";

const {
  ConfigurationError,
  TransientError,
  SkippableError
} = require("hull/src/errors");

const {
  ZapierOutgoingEntity
} = require("./service-objects");

const { HullOutgoingUser } = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");
const { isNull, notNull } = require("hull-connector-framework/src/purplefusion/conditionals");

const service = (): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://hooks.zapier.com/",
  endpoints: {
    sendZap: {
      url: "${zap_url}",
      operation: "post",
      endpointType: "create",
      returnObj: "body.data"
    }
  },
  superagent: {},
  error: {
    parser: {

    },
    templates: [
      {
        truthy: { status: 400 },
        errorType: SkippableError,
        message: ""
      },
      {
        truthy: { status: 410 },
        errorType: SkippableError,
        message: "Subscription Invalid",
        recoveryroute: "unsubscribeFromError"
      }
    ]
  }
});

module.exports = service;
