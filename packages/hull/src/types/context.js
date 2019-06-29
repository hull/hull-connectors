// @flow

import type {
  HullClientCredentials,
  HullUserSegment,
  HullAccountSegment,
  HullConnector,
  HullConnectorConfig,
  HullClientConfig
} from "./index";
import type { agent } from "superagent";

// =====================================
//   Hull Context
// =====================================

export type HullContextBase = {
  requestId?: string, // request id
  hostname: string, // req.hostname
  options: Object, // req.query
  isBatch: boolean,
  HullClient: Class<Client>,

  connectorConfig: HullConnectorConfig, // configuration passed to Hull.Connector
  clientConfig: HullClientConfig, // configuration which will be applied to Hull Client

  cache: ConnectorCache,
  metric: MetricAgent,
  enqueue: (
    // queueAdapter: Object,
    // // eslint-disable-next-line no-use-before-define
    // ctx: HullContext,
    jobName: string,
    jobPayload?: Object,
    options?: Object
  ) => Promise<*>,

  token?: string,
  clientCredentials?: HullClientCredentials, // HullClient credentials
  clientCredentialsToken?: string, // signed (not encrypted) jwt token with HullClient credentials
  clientCredentialsEncryptedToken?: string // encrypted token with HullClient credentials
};
export type HullContext = {
  /**
   * Context added to the express app request by hull-node connector sdk.
   * Accessible via `req.hull` param.
   * @public
   * @memberof Types
   */
  ...$Exact<HullContextBase>,
  handlerName?: string,
  clientCredentials: HullClientCredentials, // HullClient configuration
  // clientCredentialsToken?: string,
  clientCredentialsToken: string,
  clientCredentialsEncryptedToken: string,
  // connector?: HullConnector,
  connector: HullConnector,
  // usersSegments?: Array<HullSegment>,
  // accountsSegments?: Array<HullSegment>
  usersSegments: Array<HullUserSegment>,
  accountsSegments: Array<HullAccountSegment>,
  client: Client,
  notification?: HullNotification,
  connector: HullConnector,
  authParams?: {},
  // @TODO => refine Superagent signature
  request: agent,
  helpers: {
    settingsUpdate: $Call<typeof settingsUpdate, HullContext>,
    incomingClaims: $Call<typeof incomingClaims, HullContext>,
    extractRequest: $Call<typeof extractRequest, HullContext>
  }
};
