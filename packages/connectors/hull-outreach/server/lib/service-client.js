/* @flow */
import type { HullClientLogger, HullMetrics, HullContext } from "hull";

import type {
  OutreachList,
  OutreachAccountRead,
  OutreachAccountWrite,
  OutreachAccountReadData,
  OutreachProspectRead,
  OutreachProspectWrite,
  OutreachProspectReadData,
  OutreachAccountUpdateEnvelope,
  OutreachProspectUpdateEnvelope,
  SuperAgentResponse
} from "./types";

const { Client } = require("hull");

const _ = require("lodash");

const debug = require("debug")("hull-outreach:service-client");

const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const uri = require("urijs");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

class ServiceClient {
  /**
   * hostname of the connector
   * used to construct the webhook callback if webhooks need to be installed
   *
   * @type {string}
   * @memberof ServiceClient
   */
  connectorHostname: string;

  /**
   * Gets or sets the instance of superagent to use for API calls.
   *
   * @type {superagent}
   * @memberof ServiceClient
   */
  agent: superagent;

  /**
   * Gets or sets the client for logging metrics.
   *
   * @type {HullMetrics}
   * @memberof ServiceClient
   */
  metricsClient: HullMetrics;

  /**
   * Gets or sets the client for connector logging.
   *
   * @type {HullClientLogger}
   * @memberof ServiceClient
   */
  loggerClient: HullClientLogger;

  accessToken: string;

  refreshToken: string;

  settingsUpdate: object;

  /**
   *Creates an instance of ServiceClient.
   * @param {CioServiceClientConfiguration} config The configuration to set up the client.
   * @memberof ServiceClient
   */
  constructor(ctx: HullContext) {
    this.loggerClient = ctx.client.logger;
    this.metricsClient = ctx.metric;
    this.connectorHostname = ctx.hostname;
    this.settingsUpdate = ctx.helpers.settingsUpdate;

    this.accessToken = ctx.connector.private_settings.access_token;
    this.refreshToken = ctx.connector.private_settings.refresh_token;

    debug(`Found AccessToken: ${this.accessToken}`);
    debug(`Found AccessToken: ${this.refreshToken}`);

    this.agent = superagent
      .agent()
      .use(superagentUrlTemplatePlugin({}))
      .use(
        superagentInstrumentationPlugin({
          logger: this.loggerClient,
          metric: this.metricsClient
        })
      )
      .use(prefixPlugin("https://api.outreach.io/api/v2"))
      .set("Authorization", `Bearer ${this.accessToken}`)
      .set({ "Content-Type": "application/vnd.api+json" })
      .on("error", error => {
        if (error.status === 401) {
          if (_.isEmpty(this.accessToken)) {
            this.loggerClient.error(
              "Not authorized with Outreach yet, please authenticate with Outreach using the Credentials button on the settings page"
            );
          } else {
            this.loggerClient.error(
              "API AccessToken no longer valid, please authenticate with Outreach again using the Credentials button on the settings page"
            );
          }
        } else {
          this.loggerClient.error(
            `Received ${
              error.status
            } Error code while connecting with the Outreach API, please contact Hull support`
          );
          this.loggerClient.debug(
            `Received ${
              error.status
            } Error code while connecting with the Outreach API, please contact Hull support, ${JSON.stringify(
              error
            )}`
          );
        }
      })
      .on("response", res => {
        // https://api.outreach.io/api/v2/docs#rate-limiting
        // Limited to 5k per hour "on a per user basis" -> which I assume means api user
        const limit = _.get(res.header, "x-rate-limit-limit");
        const remaining = _.get(res.header, "x-rate-limit-remaining");
        // const reset = _.get(res.header, "x-rate-limit-reset");
        if (remaining !== undefined) {
          this.metricsClient.value("ship.service_api.remaining", remaining);
        }

        if (limit !== undefined) {
          this.metricsClient.value("ship.service_api.limit", limit);
        }
      })
      .timeout({ response: 500000 })
      .ok(res => res.status === 200);
  }

  /**
   * This is a wrapper which we can use to handle http errors
   * can be used for timeouts, token refreshes etc...
   *
   * @param {Promise} promise
   */
  agentErrorHandler(promise: () => Promise<mixed>): Promise<*> {
    return promise().catch(error => {
      if (error.status === 401 && this.refreshToken) {
        this.loggerClient.debug(
          "trying to refresh token and retry query",
          _.get(error, "response.body")
        );

        return this.checkToken().then(() => promise());
      }
      return Promise.reject(error);
    });
  }

  checkToken(): Promise<*> {
    return this.refreshAccessToken()
      .catch(refreshErr => {
        this.loggerClient.error("Error in refreshAccessToken", refreshErr);
        return Promise.reject(refreshErr);
      })
      .then(res => {
        const { expires_in, created_at, refresh_token, access_token } = _.pick(
          res.body,
          ["expires_in", "created_at", "refresh_token", "access_token"]
        );
        if (!_.isEmpty(access_token)) {
          this.accessToken = access_token;
          this.refreshToken = refresh_token;
          this.agent.set("Authorization", `Bearer ${this.accessToken}`);

          // and send it back to the settingsUpdate
          return this.settingsUpdate({
            token_expires_in: expires_in,
            token_created_at: created_at,
            refresh_token,
            access_token
          });
        }
        return Promise.reject(
          new Error(
            "Unauthorized, and unable to refresh token.  Please try clicking the credentials button on the settings page and reauthenticating the connector"
          )
        );
      });
  }

  refreshAccessToken(): Promise<any> {
    this.metricsClient.increment("ship.service_api.call", 1);
    const redirectUri = `https://${this.connectorHostname}/auth/callback`;

    return this.agent.post("https://api.outreach.io/oauth/token").send({
      refresh_token: this.refreshToken,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "refresh_token"
    });
  }

  /**
   * Lists or searches all accounts that match the given parameters.
   *
   * @param {string} query The query to narrow down the results.
   * @param {number} [limit=100] The number of records per page.
   * @param {number} [skip=0] The number of records to skip.
   * @returns {Promise<OutreachListResponse<OutreachAccountRead>>} The list response.
   * @memberof ServiceClient
   */
  getOutreachAccounts(): Promise<
    SuperAgentResponse<OutreachList<OutreachAccountReadData>>
  > {
    debug("getAccounts");
    return this.agentErrorHandler(() => {
      return this.agent.get("/accounts/");
    });
  }

  /**
   * Lists or searches all accounts that match the given parameters.
   * @returns {Promise<OutreachListResponse<OutreachAccountRead>>} The list response.
   * @memberof ServiceClient
   */
  findOutreachAccounts(
    attribute: string,
    value: string
  ): Promise<SuperAgentResponse<OutreachList<OutreachAccountReadData>>> {
    debug(`findOutreachAccounts filter[${attribute}]=${value}`);
    return this.agentErrorHandler(() => {
      return this.agent
        .get("/accounts/")
        .query(`filter[${attribute}]=${value}`);
    });
  }

  /**
   * Creates a new account in outreach.io.
   *
   * @param {OutreachAccountWrite} data The outreach.io object data.
   * @returns {Promise<OutreachAccountRead>} The data of the created close.io object.
   * @memberof ServiceClient
   */
  postAccount(
    data: OutreachAccountWrite
  ): Promise<SuperAgentResponse<OutreachAccountRead>> {
    return this.agentErrorHandler(() => {
      return this.agent
        .post("/accounts/")
        .send(data)
        .ok(res => res.status === 201);
    });
  }

  postAccountEnvelopes(
    envelopes: Array<OutreachAccountUpdateEnvelope>
  ): Promise<Array<OutreachAccountUpdateEnvelope>> {
    return this.agentErrorHandler(() => {
      return Promise.all(
        envelopes.map(envelope => {
          const enrichedEnvelope = _.cloneDeep(envelope);
          return this.postAccount(envelope.outreachAccountWrite)
            .then(response => {
              enrichedEnvelope.outreachAccountRead = response.body;
              return enrichedEnvelope;
            })
            .catch(error => {
              enrichedEnvelope.error = error.response.body;
              return enrichedEnvelope;
            });
        })
      );
    });
  }

  /**
   * Updates an exisitng account in outreach.io.
   *
   * @param {OutreachAccount} data The outreach.io object data.
   * @returns {Promise<OutreachAccountRead>} The data of the updated outreach.io object.
   * @memberof ServiceClient
   */
  patchAccount(
    data: OutreachAccountWrite,
    outreachAccountId: number
  ): Promise<OutreachAccountRead> {
    if (outreachAccountId === undefined) {
      return Promise.reject(new Error("Cannot update account without id"));
    }

    return this.agentErrorHandler(() => {
      return this.agent.patch(`/accounts/${outreachAccountId}`).send(data);
    });
  }

  patchAccountEnvelopes(
    envelopes: Array<OutreachAccountUpdateEnvelope>
  ): Promise<Array<OutreachAccountUpdateEnvelope>> {
    return this.agentErrorHandler(() => {
      return Promise.all(
        envelopes.map(envelope => {
          const enrichedEnvelope = _.cloneDeep(envelope);
          const write: OutreachAccountWrite =
            enrichedEnvelope.outreachAccountWrite;
          return this.patchAccount(write, envelope.outreachAccountId)
            .then(response => {
              // $FlowFixMe
              enrichedEnvelope.outreachAccountRead = response.body;
              return enrichedEnvelope;
            })
            .catch(error => {
              enrichedEnvelope.error = error.response.body;
              return enrichedEnvelope;
            });
        })
      );
    });
  }

  /**
   * Lists all prospects that match the given parameters.
   * @returns {Promise<OutreachListResponse<OutreachProspectRead>>} The list response.
   * @memberof ServiceClient
   */
  getOutreachProspects(): Promise<
    SuperAgentResponse<OutreachList<OutreachProspectReadData>>
  > {
    debug("getProspects");
    return this.agentErrorHandler(() => {
      return this.agent.get("/prospects/");
    });
  }

  /**
   * Lists or searches all accounts that match the given parameters.
   * @returns {Promise<OutreachListResponse<OutreachAccountRead>>} The list response.
   * @memberof ServiceClient
   */
  findOutreachProspects(
    attribute: string,
    value: string
  ): Promise<SuperAgentResponse<OutreachList<OutreachProspectReadData>>> {
    debug(`findOutreachProspects filter[${attribute}]=${value}`);
    return this.agentErrorHandler(() => {
      return this.agent
        .get("/prospects/")
        .query(`filter[${attribute}]=${value}`);
    });
  }

  /**
   * Creates a new prospect in outreach.io.
   *
   * @param {OutreachAccountWrite} data The outreach.io object data.
   * @returns {Promise<OutreachAccountRead>} The data of the created close.io object.
   * @memberof ServiceClient
   */
  postProspect(data: OutreachProspectWrite): Promise<OutreachProspectRead> {
    debug(`Writing Prospect: ${JSON.stringify(data)}`);
    return this.agentErrorHandler(() => {
      return this.agent
        .post("/prospects/")
        .send(data)
        .ok(res => res.status === 201);
    });
  }

  postProspectEnvelopes(
    envelopes: Array<OutreachProspectUpdateEnvelope>
  ): Promise<Array<OutreachProspectUpdateEnvelope>> {
    return this.agentErrorHandler(() => {
      return Promise.all(
        envelopes.map(envelope => {
          const enrichedEnvelope = _.cloneDeep(envelope);
          return this.postProspect(envelope.outreachProspectWrite)
            .then(response => {
              // $FlowFixMe
              enrichedEnvelope.outreachProspectRead = response.body;
              return enrichedEnvelope;
            })
            .catch(error => {
              enrichedEnvelope.error = error.response.body;
              return enrichedEnvelope;
            });
        })
      );
    });
  }

  /**
   * Updates an exisitng prospect in outreach.io.
   *
   * @param {OutreachProspectWrite} data The outreach.io object data.
   * @returns {Promise<OutreachProspectRead>} The data of the updated outreach.io object.
   * @memberof ServiceClient
   */
  patchProspect(
    prospectWrite: OutreachProspectWrite,
    prospectId: number
  ): Promise<OutreachProspectRead> {
    if (prospectId == null) {
      return Promise.reject(new Error("Cannot update prospect without id"));
    }
    return this.agentErrorHandler(() => {
      return this.agent.patch(`/prospects/${prospectId}`).send(prospectWrite);
    });
  }

  patchProspectEnvelopes(
    envelopes: Array<OutreachProspectUpdateEnvelope>
  ): Promise<Array<OutreachProspectUpdateEnvelope>> {
    return this.agentErrorHandler(() => {
      return Promise.all(
        envelopes.map(envelope => {
          const enrichedEnvelope = _.cloneDeep(envelope);
          return this.patchProspect(
            envelope.outreachProspectWrite,
            envelope.outreachProspectId
          )
            .then(response => {
              // $FlowFixMe
              enrichedEnvelope.outreachProspectRead = response.body;
              return enrichedEnvelope;
            })
            .catch(error => {
              enrichedEnvelope.error = error.response.body;
              return enrichedEnvelope;
            });
        })
      );
    });
  }

  /**
   *  Creates the webhook that we need for getting account/prospect update
   * as well as changing events.  One webhook for now, but may change to multiple later
   * our plan is to filter client side for now...
   *
   * @param {OutreachProspectWrite} data The outreach.io object data.
   * @returns {Promise<OutreachProspectRead>} The data of the updated outreach.io object.
   * @memberof ServiceClient
   */
  createWebhook(client: Client): Promise<any> {
    /**
     * https://api.outreach.io/api/v2/docs#respond-to-platform-events
     */
    const webhookUrl: string = this.buildWebhookUrl(client);
    const genericWebhook = {
      data: {
        type: "webhook",
        attributes: {
          url: webhookUrl
        }
      }
    };

    return this.agentErrorHandler(() => {
      return this.agent
        .post("/webhooks/")
        .send(genericWebhook)
        .ok(res => res.status === 201);
    });
  }

  getWebhooks(): Promise<SuperAgentResponse<OutreachList<any>>> {
    return this.agentErrorHandler(() => {
      return this.agent.get("/webhooks/");
    });
  }

  findWebhook(attribute: string, value: string): Promise<any> {
    return this.agentErrorHandler(() => {
      return this.agent
        .get("/webhooks/")
        .query(`filter[${attribute}]=${value}`);
    });
  }

  getExistingWebhookId(client: Client): Promise<number> {
    return this.agentErrorHandler(() => {
      return this.getWebhooks().then(response => {
        const dataArray = _.get(response, "body.data");
        if (!_.isEmpty(dataArray)) {
          const webhookUrl: string = this.buildWebhookUrl(client);

          const thisConnectorWebhooks = dataArray.filter(
            webhook => webhook.attributes.url === webhookUrl
          );

          if (thisConnectorWebhooks.length > 0) {
            debug(`Found ${thisConnectorWebhooks.length} Existing webhooks`);
            return thisConnectorWebhooks[0].id;
          }
        }
        debug("Existing Webhook not found");
        return Promise.resolve(-1);
      });
    });
  }

  buildWebhookUrl(client: Client): string {
    const { organization, id, secret } = client.configuration();
    const search = {
      organization,
      secret,
      ship: id
    };
    return uri(`https://${this.connectorHostname}/webhooks`)
      .search(search)
      .toString();
  }
}

module.exports = ServiceClient;
