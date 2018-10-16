/* @flow */
import type { THullReqContext } from "hull";

import type {
  HullMetrics,
  HullClientLogger,
  OutreachList,
  OutreachAccountRead,
  OutreachAccountWrite,
  OutreachAccountReadData,
  OutreachAccountWriteData,
  OutreachProspectRead,
  OutreachProspectWrite,
  OutreachProspectReadData,
  OutreachProspectWriteData,
  OutreachAccountUpdateEnvelope,
  OutreachProspectUpdateEnvelope,
  SuperAgentResponse
} from "./types";

const _ = require("lodash");

const debug = require("debug")("hull-outreach:service-client");

const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");

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
   *Creates an instance of ServiceClient.
   * @param {CioServiceClientConfiguration} config The configuration to set up the client.
   * @memberof ServiceClient
   */
  constructor(ctx: THullReqContext) {
    this.loggerClient = ctx.client.logger;
    this.metricsClient = ctx.metric;
    this.connectorHostname = ctx.hostname;

    const accessToken = ctx.connector.private_settings.access_token;
    console.log(`Token: ${accessToken}`);
    this.agent = superagent
      .agent()
      .use(superagentUrlTemplatePlugin({}))
      .use(
        superagentInstrumentationPlugin({
          logger: this.loggerClient,
          metric: this.metricsClient
        })
      )
      .use(prefixPlugin("https://api.outreach.io"))
      .set("Authorization", `Bearer ${accessToken}`)
      .set({ "Content-Type": "application/vnd.api+json" })
      .on("response", res => {
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
    return this.agent.get("/api/v2/accounts/");
  }

  /**
   * Creates a new account in outreach.io.
   *
   * @param {OutreachAccountWrite} data The outreach.io object data.
   * @returns {Promise<OutreachAccountRead>} The data of the created close.io object.
   * @memberof ServiceClient
   */
  postAccount(data: OutreachAccountWrite): Promise<OutreachAccountRead> {
    return this.agent
      .post("/api/v2/accounts/")
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

    return this.agent.patch(`/api/v2/accounts/${outreachAccountId}`).send(data);
  }

  patchAccountEnvelopes(
    envelopes: Array<OutreachAccountUpdateEnvelope>
  ): Promise<Array<OutreachAccountUpdateEnvelope>> {
    return Promise.all(
      envelopes.map(envelope => {
        const enrichedEnvelope = _.cloneDeep(envelope);
        return this.patchAccount(
          envelope.outreachAccountWrite,
          envelope.outreachAccountId
        )
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
    return this.agent.get("/api/v2/prospects/");
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
      .get("/api/v2/accounts/")
      .query(`filter[${attribute}]=${value}`)
      .catch(error => {
        console.log(error);
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
    console.log(`Writing Prospect: ${JSON.stringify(data)}`);
    return this.agent
      .post("/api/v2/prospects/")
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
      .patch(`/api/v2/prospects/${prospectId}`)
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
  createWebhook(): Promise<any> {
    /**
     * https://api.outreach.io/api/v2/docs#respond-to-platform-events
     */

    const genericWebhook = {
      data: {
        type: "webhook",
        attributes: {
          url: `https://${this.connectorHostname}/webhooks`
        }
      }
    };

    return this.agent
      .post("/api/v2/webhooks")
      .send(genericWebhook)
      .ok(res => res.status === 201);
  }
}

module.exports = ServiceClient;
