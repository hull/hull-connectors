/* @flow */
import type { IncomingMessage } from "http";

import type {
  TypeformResponse,
  TypeformFormMinimal,
  TypeformForm,
  TypeformServiceClientOptions
} from "../types";

export type TypeformGetAllResponsesResponse = {
  ...IncomingMessage,
  body: {
    total_items: string,
    page_count: string,
    items: Array<TypeformResponse>
  }
};

export type TypeformGetFormsResponse = {
  ...IncomingMessage,
  body: {
    total_items: string,
    page_count: string,
    items: Array<TypeformFormMinimal>
  }
};

export type TypeformGetFormResponse = {
  ...IncomingMessage,
  body: TypeformForm
};

const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const Promise = require("bluebird");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

class ServiceClient {
  agent: *;

  accessToken: string;

  refreshToken: string;

  clientId: string;

  clientSecret: string;

  hullClient: *;

  metric: *;

  constructor({
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    client,
    metric
  }: TypeformServiceClientOptions) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.hullClient = client;
    this.metric = metric;
    this.agent = superagent
      .agent()
      .use(superagentUrlTemplatePlugin({}))
      .use(
        superagentInstrumentationPlugin({
          logger: this.hullClient.logger,
          metric: this.metric
        })
      )
      .use(prefixPlugin("https://api.typeform.com"))
      .set("Authorization", `Bearer ${accessToken}`);
  }

  async getForms(): Promise<Array<TypeformFormMinimal>> {
    let forms = [];
    let page = 1;
    let pageData = await this.agent.get("/forms").query({
      page
    });
    while (pageData.body.items && pageData.body.items.length) {
      forms = forms.concat(pageData.body.items);
      page += 1;
      // eslint-disable-next-line no-await-in-loop
      pageData = await this.agent.get("/forms").query({
        page
      });
    }
    return forms;
  }

  async getForm(formId: string): Promise<TypeformGetFormResponse> {
    return this.agent.get(`/forms/${formId}`);
  }

  /**
   * @see https://developer.typeform.com/responses/reference/retrieve-responses/#retrieve-responses
   */
  getResponses(
    formId: string,
    {
      pageSize,
      since,
      until,
      after,
      before,
      completed,
      sort,
      query,
      fields
    }: Object = {}
  ): Promise<TypeformGetAllResponsesResponse> {
    return this.agent.get(`/forms/${formId}/responses`).query({
      page_size: pageSize,
      since,
      until,
      after,
      before,
      completed,
      sort,
      query,
      fields
    });
  }

  /**
   * @see https://developer.typeform.com/get-started/applications/
   */
  refreshAccessToken() {
    return this.agent
      .post("https://api.typeform.com/oauth/token")
      .send("grant_type=refresh_token")
      .send(`refresh_token=${this.refreshToken}`)
      .send(`client_id=${this.clientId}`)
      .send(`client_secret=${this.clientSecret}`);
  }
}

module.exports = ServiceClient;
