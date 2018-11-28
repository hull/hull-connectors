// @flow
import type { IncomingMessage } from "http";
import type { Readable } from "stream";
import type { HullConnector, HullRequest } from "hull";
import type {
  HubspotUserUpdateMessageEnvelope,
  HubspotAccountUpdateMessageEnvelope,
  HubspotContactPropertyGroups,
  HubspotCompanyPropertyGroups,
  HubspotReadContact,
  HubspotWriteContact,
  HubspotWriteCompany,
  HubspotReadCompany
} from "../types";

declare type HubspotGetAllContactsResponse = {
  ...IncomingMessage,
  body: {
    contacts: Array<HubspotReadContact>,
    "has-more": boolean,
    "time-offset": string,
    "vid-offset": string
  }
};

declare type HubspotGetAllCompaniesResponse = {
  ...IncomingMessage,
  body: {
    companies: Array<HubspotReadCompany>,
    "has-more": boolean,
    offset: string
  }
};

declare type HubspotGetCompanyResponse = {
  ...IncomingMessage,
  body: HubspotReadCompany
};

const _ = require("lodash");
const Promise = require("bluebird");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const moment = require("moment");

const { ConfigurationError } = require("hull/src/errors");
const {
  promiseToReadableStream,
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

class HubspotClient {
  connector: HullConnector;

  client: Object;

  metric: Object;

  agent: superagent;

  settingsUpdate: Function;

  incomingAccountIdentHull: string;

  incomingAccountIdentService: string;

  constructor(ctx: HullRequest) {
    this.connector = ctx.connector;
    this.client = ctx.client;
    this.metric = ctx.metric;
    this.settingsUpdate = ctx.helpers.settingsUpdate;

    const accessToken = this.connector.private_settings.token;
    this.agent = superagent
      .agent()
      .use(superagentUrlTemplatePlugin({}))
      .use(
        superagentInstrumentationPlugin({
          logger: this.client.logger,
          metric: this.metric
        })
      )
      .use(
        prefixPlugin(
          process.env.OVERRIDE_HUBSPOT_URL || "https://api.hubapi.com"
        )
      )
      .set("Authorization", `Bearer ${accessToken}`)
      .timeout({
        response: 5000
      });
  }

  refreshAccessToken(): Promise<*> {
    const refreshToken = this.connector.private_settings.refresh_token;
    if (!refreshToken) {
      return Promise.reject(new Error("Refresh token is not set."));
    }
    this.metric.increment("ship.service_api.call", 1);
    return this.agent
      .post("/oauth/v1/token")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send({
        refresh_token: refreshToken,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: "",
        grant_type: "refresh_token"
      });
  }

  isConfigured() {
    return !_.isEmpty(this.connector.private_settings.token);
  }

  /**
   * This is a wrapper which handles the access_token errors for hubspot queries
   * and runs `checkToken` to make sure that our token didn't expire.
   * Then it retries the query once.
   * @param {Promise} promise
   */
  retryUnauthorized(promise: () => Promise<mixed>): Promise<*> {
    return promise().catch(err => {
      if (err.response && err.response.unauthorized) {
        this.client.logger.debug("retrying query", _.get(err, "response.body"));
        return this.checkToken({
          force: true
        })
          .catch(error => {
            if (error.response) {
              const errorMessage =
                "Failed to refresh access token, try to reauthorize the connector";
              return Promise.reject(new ConfigurationError(errorMessage));
            }
            return Promise.reject(error);
          })
          .then(() => promise());
      }
      return Promise.reject(err);
    });
  }

  checkToken({
    force = false
  }: {
    force: boolean
  } = {}): Promise<*> {
    let { token_fetched_at, expires_in } = this.connector.private_settings;
    if (!token_fetched_at || !expires_in) {
      this.client.logger.error(
        "checkToken: Ship private settings lack token information"
      );
      token_fetched_at = moment()
        .utc()
        .format("x");
      expires_in = 0;
    }

    const expiresAt = moment(token_fetched_at, "x").add(expires_in, "seconds");
    const willExpireIn = expiresAt.diff(moment(), "seconds");
    const willExpireSoon =
      willExpireIn <=
      (parseInt(process.env.HUBSPOT_TOKEN_REFRESH_ADVANCE, 10) || 600); // 10 minutes
    this.client.logger.debug("access_token", {
      fetched_at: moment(token_fetched_at, "x").format(),
      expires_in,
      expires_at: expiresAt.format(),
      will_expire_in: willExpireIn,
      utc_now: moment().format(),
      will_expire_soon: willExpireSoon
    });
    if (willExpireSoon || force) {
      return this.refreshAccessToken().then(res => {
        this.agent.set("Authorization", `Bearer ${res.body.access_token}`);
        return this.settingsUpdate({
          expires_in: res.body.expires_in,
          token_fetched_at: moment()
            .utc()
            .format("x"),
          token: res.body.access_token
        });
      });
    }
    return Promise.resolve("valid");
  }

  /**
   * Get 100 hubspot contacts and queues their import
   * and getting another 100 - needs to be processed in one queue without
   * any concurrency
   * @see http://developers.hubspot.com/docs/methods/contacts/get_contacts
   * @param  {Number} [count=100]
   * @param  {Number} [offset=0]
   * @return {Promise}
   */
  getAllContacts(
    properties: Array<string>,
    count: number = 100,
    offset: ?string = null
  ): Promise<HubspotGetAllContactsResponse> {
    return this.retryUnauthorized(() => {
      return this.agent.get("/contacts/v1/lists/all/contacts/all").query({
        count,
        vidOffset: offset,
        property: properties
      });
    });
  }

  getAllContactsStream(
    properties: Array<string>,
    count: number = 100,
    offset: ?string = null
  ): Readable {
    const getAllContacts = this.getAllContacts.bind(this);

    function getAllContactsPage(push, pageCount, pageOffset) {
      return getAllContacts(properties, pageCount, pageOffset).then(
        response => {
          const contacts = response.body.contacts;
          const hasMore = response.body["has-more"];
          const vidOffset = response.body["vid-offset"];
          if (contacts.length > 0) {
            push(contacts);
            if (hasMore) {
              return getAllContactsPage(push, pageCount, vidOffset);
            }
          }
          return Promise.resolve();
        }
      );
    }

    return promiseToReadableStream(push => {
      return getAllContactsPage(push, count, offset);
    });
  }

  /**
   * Get 100 hubspot contacts and queues their import
   * and getting another 100 - needs to be processed in one queue without
   * any concurrency
   * @see http://developers.hubspot.com/docs/methods/contacts/get_contacts
   * @param  {Number} [count=100]
   * @param  {Number} [offset=0]
   * @return {Promise}
   */
  getAllCompanies(
    properties: Array<string>,
    limit: number = 100,
    offset: ?string = null
  ): Promise<HubspotGetAllCompaniesResponse> {
    return this.retryUnauthorized(() => {
      return this.agent.get("/companies/v2/companies/paged").query({
        limit,
        offset,
        properties
      });
    });
  }

  getAllCompaniesStream(
    properties: Array<string>,
    count: number = 100,
    offset: ?string = null
  ): Readable {
    const getAllCompaniesPage = (push, pageCount, pageOffset) => {
      return this.getAllCompanies(properties, pageCount, pageOffset).then(
        response => {
          const companies = response.body.companies;
          const hasMore = response.body["has-more"];
          const nextOffset = response.body.offset;
          if (companies.length > 0) {
            push(companies);
            if (hasMore) {
              return getAllCompaniesPage(push, pageCount, nextOffset);
            }
          }
          return Promise.resolve();
        }
      );
    };
    return promiseToReadableStream(push => {
      return getAllCompaniesPage(push, count, offset);
    });
  }

  /**
   * Get most recent contacts and filters out these who last modification
   * time if older that the lastFetchAt. If there are any contacts modified since
   * that time queues import of them and getting next chunk from hubspot API.
   * @see http://developers.hubspot.com/docs/methods/contacts/get_recently_updated_contacts
   * @param  {Date} lastFetchAt
   * @param  {Date} stopFetchAt
   * @param  {Number} [count=100]
   * @param  {Number} [offset=0]
   * @return {Promise -> Array}
   */
  getRecentlyUpdatedContacts(
    properties: Array<string> = [],
    count: number = 100,
    offset: ?string = null
  ): Promise<HubspotGetAllContactsResponse> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/contacts/v1/lists/recently_updated/contacts/recent")
        .query({
          count,
          vidOffset: offset,
          property: properties
        });
    });
  }

  getRecentContactsStream(
    lastFetchAt: string,
    stopFetchAt: string,
    properties: Array<string>,
    count: number = 100,
    offset: ?string = null
  ): Readable {
    return promiseToReadableStream(push => {
      const getRecentContactsPage = pageOffset => {
        return this.getRecentlyUpdatedContacts(
          properties,
          count,
          pageOffset
        ).then(response => {
          const contacts = response.body.contacts.filter(c => {
            const time = moment(
              c.properties.lastmodifieddate.value,
              "x"
            ).milliseconds(0);
            return (
              time.isAfter(lastFetchAt) &&
              time
                .subtract(
                  process.env.HUBSPOT_FETCH_OVERLAP_SEC || 10,
                  "seconds"
                )
                .isBefore(stopFetchAt)
            );
          });
          const hasMore = response.body["has-more"];
          const vidOffset = response.body["vid-offset"];
          // const timeOffset = response.body["time-offset"];
          if (contacts.length > 0) {
            push(contacts);
          }
          if (hasMore) {
            return getRecentContactsPage(vidOffset);
          }

          return Promise.resolve();
        });
      };
      return getRecentContactsPage(offset);
    });
  }

  postContacts(body: Array<HubspotWriteContact>): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .post("/contacts/v1/contact/batch/")
        .query({
          auditId: "Hull"
        })
        .set("Content-Type", "application/json")
        .send(body);
    });
  }

  postContactsEnvelopes(
    envelopes: Array<HubspotUserUpdateMessageEnvelope>
  ): Promise<Array<HubspotUserUpdateMessageEnvelope>> {
    if (envelopes.length === 0) {
      return Promise.resolve([]);
    }
    const body = envelopes.map(envelope => envelope.hubspotWriteContact);

    function handleSuccessResponse(res) {
      if (res.statusCode === 202) {
        return Promise.resolve(envelopes);
      }
      const erroredOutEnvelopes = envelopes.map(envelope => {
        envelope.error = "unknown response from hubspot";
        return envelope;
      });
      return Promise.resolve(erroredOutEnvelopes);
    }

    return this.postContacts(body)
      .then(handleSuccessResponse)
      .catch(responseError => {
        const errorInfo = responseError.response.body;
        if (errorInfo.status !== "error") {
          const erroredOutEnvelopes = envelopes.map(envelope => {
            envelope.error = "unknown response from hubspot";
            return envelope;
          });
          return Promise.resolve(erroredOutEnvelopes);
        }
        const erroredOutEnvelopes = _.get(errorInfo, "failureMessages", []).map(
          error => {
            const envelope = envelopes[error.index];
            const hubspotMessage =
              error.propertyValidationResult &&
              _.truncate(error.propertyValidationResult.message, {
                length: 100
              });
            const hubspotPropertyName =
              error.propertyValidationResult &&
              error.propertyValidationResult.name;
            envelope.error =
              hubspotMessage || error.message || error.error.message;
            envelope.errorProperty = hubspotPropertyName;
            return envelope;
          }
        );

        const retryEnvelopes = envelopes.filter((envelope, index) => {
          return !_.find(errorInfo.failureMessages, {
            index
          });
        });

        if (retryEnvelopes.length === 0) {
          return Promise.resolve(erroredOutEnvelopes);
        }
        const retryBody = retryEnvelopes.map(
          envelope => envelope.hubspotWriteContact
        );
        return this.postContacts(retryBody)
          .then(handleSuccessResponse)
          .catch(() => {
            const retryErroredOutEnvelopes = envelopes.map(envelope => {
              envelope.error = "batch retry rejected";
              return envelope;
            });
            return Promise.resolve(retryErroredOutEnvelopes);
          });
      });
  }

  postCompanies(body: HubspotWriteCompany): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .post("/companies/v2/companies/")
        .query({
          auditId: "Hull"
        })
        .set("Content-Type", "application/json")
        .send(body);
    });
  }

  postCompaniesEnvelopes(
    envelopes: Array<HubspotAccountUpdateMessageEnvelope>
  ): Promise<Array<HubspotAccountUpdateMessageEnvelope>> {
    if (envelopes.length === 0) {
      return Promise.resolve([]);
    }
    const promises = envelopes.map(envelope => {
      const resultEnvelope = _.cloneDeep(envelope);
      return this.postCompanies(envelope.hubspotWriteCompany)
        .then(response => {
          resultEnvelope.hubspotReadCompany = response.body;
          return resultEnvelope;
        })
        .catch(error => {
          resultEnvelope.error = error && error.response && error.response.body;
          return resultEnvelope;
        });
    });
    return Promise.all(promises);
  }

  postCompaniesUpdate(body: Array<HubspotWriteCompany>): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .post("/companies/v1/batch-async/update")
        .query({
          auditId: "Hull"
        })
        .set("Content-Type", "application/json")
        .send(body);
    });
  }

  postCompaniesUpdateEnvelopes(
    envelopes: Array<HubspotAccountUpdateMessageEnvelope>
  ): Promise<Array<HubspotAccountUpdateMessageEnvelope>> {
    if (envelopes.length === 0) {
      return Promise.resolve([]);
    }
    const body = envelopes.map(envelope => envelope.hubspotWriteCompany);

    function handleSuccessResponse(res) {
      if (res.statusCode === 202) {
        return Promise.resolve(envelopes);
      }
      const erroredOutEnvelopes = envelopes.map(envelope => {
        envelope.error = "unknown response from hubspot";
        return envelope;
      });
      return Promise.resolve(erroredOutEnvelopes);
    }
    return this.postCompaniesUpdate(body)
      .then(handleSuccessResponse)
      .catch(responseError => {
        const errorInfo = responseError.response.body;
        if (errorInfo.status !== "error") {
          const erroredOutEnvelopes = envelopes.map(envelope => {
            envelope.error = "unknown response from hubspot";
            return envelope;
          });
          return Promise.resolve(erroredOutEnvelopes);
        }
        const erroredOutEnvelopes = (errorInfo.validationResults || []).reduce(
          (agg, error) => {
            const envelope = _.find(envelopes, {
              hubspotWriteCompany: {
                objectId: error.id
              }
            });
            if (envelope === undefined) {
              return agg;
            }
            const hubspotMessage =
              error.propertyValidationResult &&
              _.truncate(error.propertyValidationResult.message, {
                length: 100
              });
            const hubspotPropertyName =
              error.propertyValidationResult &&
              error.propertyValidationResult.name;
            envelope.error =
              hubspotMessage || error.message || error.error.message;
            envelope.errorProperty = hubspotPropertyName;
            return agg.concat([envelope]);
          },
          []
        );

        const retryEnvelopes = envelopes.filter(envelope => {
          return !_.find(errorInfo.validationResults, {
            id: envelope.hubspotWriteCompany.objectId
          });
        }, []);

        if (retryEnvelopes.length === 0) {
          return Promise.resolve(erroredOutEnvelopes);
        }
        const retryBody = retryEnvelopes.map(
          envelope => envelope.hubspotWriteCompany
        );
        return this.postCompaniesUpdate(retryBody)
          .then(handleSuccessResponse)
          .catch(errorResponse => {
            const errorMessage = errorResponse.response.body.message;
            const retryErroredOutEnvelopes = envelopes.map(envelope => {
              envelope.error = `An unknown error was returned by Hubspot API when doing an update. Please contact our support team. Raw message: ${errorMessage}`;
              return envelope;
            });
            return Promise.resolve(retryErroredOutEnvelopes);
          });
      });
  }

  postCompanyDomainSearch(domain: string) {
    return this.retryUnauthorized(() => {
      return this.agent
        .post("/companies/v2/domains/{{domain}}/companies")
        .tmplVar({
          domain
        })
        .send({
          requestOptions: {
            properties: ["domain", "hs_lastmodifieddate", "name"]
          }
        });
    });
  }

  getContactPropertyGroups(): Promise<HubspotContactPropertyGroups> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/contacts/v2/groups")
        .query({
          includeProperties: true
        })
        .then(response => response.body);
    });
  }

  getCompanyPropertyGroups(): Promise<HubspotCompanyPropertyGroups> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/properties/v1/companies/groups")
        .query({
          includeProperties: true
        })
        .then(response => response.body);
    });
  }

  getCompanyVids(companyId: string, vidOffset?: string) {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/companies/v2/companies/{{companyId}}/vids")
        .tmplVar({
          companyId
        })
        .query({
          vidOffset
        });
    });
  }

  getCompanyVidsStream(companyId: string) {
    return promiseToReadableStream(push => {
      const getCompanyVidsPage = (offset?: string) => {
        return this.getCompanyVids(companyId, offset).then(response => {
          const vids = response.body.vids || [];
          if (vids.length > 0) {
            push(vids);
          }
          if (response.body.hasMore) {
            return getCompanyVidsPage(response.body.vidOffset);
          }
          return Promise.resolve();
        });
      };

      return getCompanyVidsPage();
    });
  }

  getRecentlyUpdatedCompanies(
    properties: Array<string>,
    count: number = 100,
    offset: ?string = null
  ): Promise<HubspotGetAllCompaniesResponse> {
    return this.retryUnauthorized(() => {
      return this.agent.get("/companies/v2/companies/recent/modified").query({
        count,
        offset
      });
    });
  }

  getRecentCompaniesStream(
    lastFetchAt: string,
    stopFetchAt: string,
    properties: Array<string>,
    count: number = 100,
    offset: ?string = null
  ): Readable {
    return promiseToReadableStream(push => {
      const getRecentCompaniesPage = pageOffset => {
        return this.getRecentlyUpdatedCompanies(
          properties,
          count,
          pageOffset
        ).then(response => {
          const companies = response.body.results.filter(c => {
            const time = moment(
              c.properties.hs_lastmodifieddate.value,
              "x"
            ).milliseconds(0);
            return (
              time.isAfter(lastFetchAt) &&
              time
                .subtract(
                  process.env.HUBSPOT_FETCH_OVERLAP_SEC || 10,
                  "seconds"
                )
                .isBefore(stopFetchAt)
            );
          });
          const hasMore = response.body.hasMore;
          const newOffset = response.body.offset;
          // const timeOffset = response.body["time-offset"];
          if (companies.length > 0) {
            push(companies);
          }
          if (hasMore) {
            return getRecentCompaniesPage(newOffset);
          }

          return Promise.resolve();
        });
      };
      return getRecentCompaniesPage(offset);
    });
  }

  async getCompany(companyId: string): Promise<HubspotGetCompanyResponse> {
    return this.retryUnauthorized(() => {
      return this.agent.get(`/companies/v2/companies/${companyId}`);
    });
  }
}

module.exports = HubspotClient;
