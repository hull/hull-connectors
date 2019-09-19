// @flow

import { Client } from "clearbit";
import request from "request";
import qs from "qs";
import Promise from "bluebird";
import type { HullContext } from "hull";
import { STATUS_CODES } from "http";
import type {
  ClearbitRevealResponse,
  ClearbitProspectorResponse,
  ClearbitCombined
} from "../types";

function ClearbitApi({ path, method = "get", params = {}, key }) {
  const baseUrl = `https://prospector.clearbit.com/v1${path}`;
  const url = `${baseUrl}?${qs.stringify(params, { arrayFormat: "brackets" })}`;
  return new Promise((resolve, reject) => {
    request(
      url,
      {
        method,
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        auth: { bearer: key }
      },
      (error, response, rawBody) => {
        let body;

        try {
          body = JSON.parse(rawBody);
        } catch (err) {
          body = {};
        }
        if (error) {
          reject(error);
        } else if (response.statusCode === 202 || response.statusCode >= 400) {
          const message = body.error
            ? body.error.message
            : STATUS_CODES[response.statusCode] || "Unknown";
          reject(new Error(message));
        } else {
          try {
            resolve(body);
          } catch (err) {
            reject(err);
          }
        }
      }
    );
  });
}

export default class ClearbitClient {
  key: string;

  ctx: HullContext;

  client: any;

  constructor(ctx: HullContext) {
    const { connector } = ctx;
    const { private_settings } = connector;
    const { api_key } = private_settings;
    this.ctx = ctx;
    this.key = api_key;
    this.client = new Client({ key: api_key });
  }

  enrich(params: any): Promise<void | ClearbitCombined> {
    this.ctx.client.logger.debug("clearbit.start", {
      params,
      action: "enrich"
    });
    this.ctx.metric.increment("ship.service_api.call", 1, [
      "ship_action:clearbit:enrich"
    ]);
    return this.client.Enrichment.find(params).catch(
      this.client.Enrichment.QueuedError,
      this.client.Enrichment.NotFoundError,
      () => {
        return {};
      }
    );
  }

  reveal(params: any): Promise<void | ClearbitRevealResponse> {
    this.ctx.client.logger.debug("clearbit.start", {
      params,
      action: "reveal"
    });
    this.ctx.metric.increment("ship.service_api.call", 1, [
      "ship_action:clearbit:reveal"
    ]);
    return this.client.Reveal.find(params);
  }

  discover(params: any) {
    this.ctx.client.logger.debug("clearbit.start", {
      params,
      action: "discover"
    });
    this.ctx.metric.increment("ship.service_api.call", 1, [
      "ship_action:clearbit:discover"
    ]);
    return this.client.Discovery.search(params);
  }

  prospect(params: any): Promise<void | ClearbitProspectorResponse> {
    this.ctx.metric.increment("clearbit.prospect");
    this.ctx.metric.increment("ship.service_api.call", 1, [
      "ship_action:clearbit:prospect"
    ]);
    this.ctx.client.logger.debug("clearbit.start", {
      params,
      action: "prospect"
    });
    return ClearbitApi({
      path: "/people/search",
      method: "get",
      params,
      key: this.key
    });
  }
}
