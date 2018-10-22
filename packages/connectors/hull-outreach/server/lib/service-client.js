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

  /**
   * a mutex to help us determine if we are currently refreshing AccessToken
   * so that we don't accidentially loop forever
   * not a great solution, but it should work
   * @type {[type]}
   */
  tryingToRefreshAccessToken: boolean;

  hullContext: HullContext;

  /**
   *Creates an instance of ServiceClient.
   * @param {CioServiceClientConfiguration} config The configuration to set up the client.
   * @memberof ServiceClient
   */
  constructor(ctx: HullContext) {
    this.loggerClient = ctx.client.logger;
    this.metricsClient = ctx.metric;
    this.connectorHostname = ctx.hostname;
    this.tryingToRefreshAccessToken = false;
    this.hullContext = ctx;

    const accessToken = ctx.connector.private_settings.access_token;
    debug(`Found AccessToken: ${accessToken}`);

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
      .set("Authorization", `Bearer ${accessToken}`)
      .set({ "Content-Type": "application/vnd.api+json" })
      .on("error", error => {
        if (error.status === 401) {
          if (_.isEmpty(accessToken)) {
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
      .timeout({ response: 5000 })
      .ok(res => res.status === 200);
  }

/**
  shouldRetry(error: Object, res: Object): boolean {
    if (this.tryingToRefreshAccessToken) return false;

    if (error.status === 401) {
      const accessToken = this.hullContext.connector.private_settings.access_token;
      const refreshToken = this.hullContext.connector.private_settings.refresh_token;
      if (!_.isEmpty(accessToken) &&
          !_.isEmpty(refreshToken)) {

      }
    }

    return false;
  }
*/

  refreshAccessToken(
    clientID: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<any> {
    const redirectUri = `https://${this.connectorHostname}/auth/callback`;
    return this.agent
      .post("https://api.outreach.io/oauth/token")
      .send({ client_id: clientID })
      .send({ client_secret: clientSecret })
      .send({ redirect_uri: redirectUri })
      .send({ grant_type: "refresh_token" })
      .send({ refresh_token: refreshToken });
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
    return this.agent.get("/accounts/");
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
    return this.agent
      .get("/accounts/")
      .query(`filter[${attribute}]=${value}`)
      .catch(error => {
        debug(error);
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
    return this.agent
      .post("/accounts/")
      .send(data)
      .ok(res => res.status === 201);
  }

  postAccountEnvelopes(
    envelopes: Array<OutreachAccountUpdateEnvelope>
  ): Promise<Array<OutreachAccountUpdateEnvelope>> {
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

    return this.agent.patch(`/accounts/${outreachAccountId}`).send(data);
  }

  patchAccountEnvelopes(
    envelopes: Array<OutreachAccountUpdateEnvelope>
  ): Promise<Array<OutreachAccountUpdateEnvelope>> {
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
    return this.agent.get("/prospects/");
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
    return this.agent
      .get("/prospects/")
      .query(`filter[${attribute}]=${value}`)
      .catch(error => {
        debug(error);
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
    return this.agent
      .post("/prospects/")
      .send(data)
      .ok(res => res.status === 201);
  }

  postProspectEnvelopes(
    envelopes: Array<OutreachProspectUpdateEnvelope>
  ): Promise<Array<OutreachProspectUpdateEnvelope>> {
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
    return this.agent
      .patch(`/prospects/${prospectId}`)
      .send(prospectWrite);
  }

  patchProspectEnvelopes(
    envelopes: Array<OutreachProspectUpdateEnvelope>
  ): Promise<Array<OutreachProspectUpdateEnvelope>> {
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

    return this.agent
      .post("/webhooks/")
      .send(genericWebhook)
      .ok(res => res.status === 201);
  }

  getWebhooks(): Promise<SuperAgentResponse<OutreachList<any>>> {
    return this.agent.get("/webhooks/");
  }

  findWebhook(attribute: string, value: string): Promise<any> {
    return this.agent.get("/webhooks/").query(`filter[${attribute}]=${value}`);
  }

  getExistingWebhookId(client: Client): Promise<number> {
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
