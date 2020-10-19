// @flow
import type { IncomingMessage } from "http";
import type { Readable } from "stream";
import type { HullConnector, HullContext } from "hull";
import type {
  HubspotUserUpdateMessageEnvelope,
  HubspotAccountUpdateMessageEnvelope,
  HubspotPropertyGroup,
  HubspotReadContact,
  HubspotWriteContact,
  HubspotWriteCompany,
  HubspotReadCompany,
  HubspotProperty
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

  constructor(ctx: HullContext) {
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
        response: 10000
      });
  }

  refreshAccessToken(): Promise<*> {
    const refreshToken = this.connector.private_settings.refresh_token;
    if (!refreshToken) {
      return Promise.reject(
        new ConfigurationError("Refresh token is not set.")
      );
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
      })
      .catch(error => {
        if (error.response) {
          const details =
            (error.response.body && error.response.body.message) || "unknown";
          const errorMessage = `Failed to refresh access token, try to reauthorize the connector (error message: "${details}"")`;
          return Promise.reject(new ConfigurationError(errorMessage));
        }
        return Promise.reject(error);
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
            return Promise.reject(error);
          })
          .then(() => {
            return promise();
          });
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

  getPortalInformation(): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent.get("/integrations/v1/me").then(response => {
        return Promise.resolve(response.body);
      });
    });
  }

  /**
   * Get 100 hubspot contacts and queues their import
   * and getting another 100 - needs to be processed in one queue without
   * any concurrency
   * @see http://developers.hubspot.com/docs/methods/contacts/get_contacts
   * @param properties
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
   * @param properties
   * @param limit
   * @param  {Number} [offset=0]
   * @return {Promise}
   */
  getAllCompanies(
    properties: Array<string>,
    limit: number = 100,
    offset: ?string = null
  ): Promise<HubspotGetAllCompaniesResponse> {
    return this.retryUnauthorized(() => {
      const includeMergeAudits = true;
      return this.agent.get("/companies/v2/companies/paged").query({
        includeMergeAudits,
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

  postEnvelopes({
    envelopes,
    hubspotEntity
  }: {
    envelopes: Array<
      HubspotUserUpdateMessageEnvelope | HubspotAccountUpdateMessageEnvelope
    >,
    hubspotEntity: string
  }): Promise<Array<HubspotUserUpdateMessageEnvelope>> {
    if (hubspotEntity === "contact") {
      return this.postContactsEnvelopes({ envelopes });
    }

    if (hubspotEntity === "company") {
      return this.postCompaniesUpdateEnvelopes({ envelopes });
    }

    return Promise.resolve({});
  }

  handleSuccessResponse(envelopes) {
    return res => {
      if (res.statusCode === 202) {
        return Promise.resolve(envelopes);
      }
      const erroredOutEnvelopes = envelopes.map(envelope => {
        envelope.error = "unknown response from hubspot";
        return envelope;
      });
      return Promise.resolve(erroredOutEnvelopes);
    };
  }

  postContactsEnvelopes({
    envelopes
  }: {
    envelopes: Array<HubspotUserUpdateMessageEnvelope>
  }): Promise<Array<HubspotUserUpdateMessageEnvelope>> {
    if (envelopes.length === 0) {
      return Promise.resolve([]);
    }
    const body = envelopes.map(envelope => envelope.hubspotWriteContact);

    return this.postContacts(body)
      .then(this.handleSuccessResponse(envelopes))
      .catch(responseError => {
        return Promise.reject(responseError);
      });
  }

  postCompaniesUpdateEnvelopes({
    envelopes
  }: {
    envelopes: Array<HubspotAccountUpdateMessageEnvelope>
  }): Promise<Array<HubspotAccountUpdateMessageEnvelope>> {
    if (envelopes.length === 0) {
      return Promise.resolve([]);
    }
    const body = envelopes.map(envelope => envelope.hubspotWriteCompany);

    return this.postCompaniesUpdate(body)
      .then(this.handleSuccessResponse(envelopes))
      .catch(responseError => {
        return Promise.reject(responseError);
      });
  }

  postCompaniesInsertEnvelopes({
    envelopes
  }: {
    envelopes: Array<HubspotAccountUpdateMessageEnvelope>
  }): Promise<Array<HubspotAccountUpdateMessageEnvelope>> {
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

  getContactPropertyGroups(): Promise<Array<HubspotPropertyGroup>> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/contacts/v2/groups")
        .query({
          includeProperties: true
        })
        .then(response => response.body);
    });
  }

  getCompanyPropertyGroups(): Promise<Array<HubspotPropertyGroup>> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/properties/v1/companies/groups")
        .query({
          includeProperties: true
        })
        .then(response => response.body);
    });
  }

  postCompanyPropertyGroups(): Promise<Array<HubspotPropertyGroup>> {
    return this.agent
      .post("/properties/v1/companies/groups")
      .send({
        name: "hull",
        displayName: "Hull Properties",
        displayOrder: 1
      })
      .then(res => res.body);
  }

  postContactPropertyGroups(): Promise<Array<HubspotPropertyGroup>> {
    return this.agent
      .post("/contacts/v2/groups")
      .send({
        name: "hull",
        displayName: "Hull Properties",
        displayOrder: 1
      })
      .then(res => res.body);
  }

  updateCompanyProperty(
    property: HubspotProperty
  ): Promise<Array<HubspotPropertyGroup>> {
    return this.agent
      .put(`/properties/v1/companies/properties/named/${property.name}`)
      .send(property)
      .then(res => res.body);
  }

  updateContactProperty(
    property: HubspotProperty
  ): Promise<Array<HubspotPropertyGroup>> {
    return this.agent
      .put(`/contacts/v2/properties/named/${property.name}`)
      .send(property)
      .then(res => res.body);
  }

  createCompanyProperty(
    property: HubspotProperty
  ): Promise<Array<HubspotPropertyGroup>> {
    return this.agent
      .post("/properties/v1/companies/properties")
      .send(property)
      .then(res => res.body);
  }

  createContactProperty(
    property: HubspotProperty
  ): Promise<Array<HubspotPropertyGroup>> {
    return this.agent
      .post("/contacts/v2/properties")
      .send(property)
      .then(res => res.body);
  }

  getCompany(companyId: string): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/companies/v2/companies/{{companyId}}")
        .tmplVar({
          companyId
        })
        .then(response => response.body);
    });
  }

  getContactByEmail(email: string): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/contacts/v1/contact/email/{{email}}/profile")
        .tmplVar({
          email
        })
        .then(response => response.body);
    });
  }

  getContactById(contactId: string): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/contacts/v1/contact/vid/{{contactId}}/profile")
        .tmplVar({
          contactId
        })
        .then(response => response.body);
    });
  }

  getVisitor(utk: string): Promise<*> {
    return this.retryUnauthorized(() => {
      return this.agent
        .get("/contacts/v1/contact/utk/{{utk}}/profile")
        .tmplVar({
          utk
        })
        .then(response => response.body);
    });
  }

  sendEvent(event): Promise<*> {
    return superagent.get("https://track.hubspot.com/v1/event").query(event);
  }
}

module.exports = HubspotClient;
