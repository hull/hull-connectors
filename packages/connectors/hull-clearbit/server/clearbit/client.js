// @flow

import { Client } from "clearbit";
// import BluebirdPromise from "bluebird";
import type { HullContext } from "hull";
import type {
  ClearbitRevealResponse,
  ClearbitProspectorResponse,
  ClearbitCombined
} from "../types";

export default class ClearbitClient {
  key: string;

  ctx: HullContext;

  client: any;

  constructor(ctx: HullContext) {
    const { connector } = ctx;
    const { private_settings } = connector;
    const { api_key } = private_settings;
    this.ctx = ctx;
    this.client = new Client({ key: api_key });
  }

  enrich(
    params: any
  ): Promise<{ error: any, code: string } | ClearbitCombined> {
    const { logger } = this.ctx.client;
    logger.debug("clearbit.start", {
      params,
      action: "enrich"
    });
    this.ctx.metric.increment("ship.service_api.call", 1, [
      "ship_action:clearbit:enrich"
    ]);
    return this.client.Enrichment.find(params)
      .catch(this.client.Enrichment.QueuedError, error => {
        const code = "queued";
        logger.info("clearbit.enrich.info", { error, code });
        return { error, code };
      })
      .catch(this.client.Enrichment.NotFoundError, error => {
        const code = "not_found";
        logger.error("clearbit.enrich.error", { error, code });
        return { error, code };
      });
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

  prospect(params: any): Promise<ClearbitProspectorResponse> {
    this.ctx.client.logger.debug("clearbit.start", {
      params,
      action: "prospect"
    });
    this.ctx.metric.increment("ship.service_api.call", 1, [
      "ship_action:clearbit:prospect"
    ]);
    return this.client.Prospector.search(params);
    // return ClearbitApi({
    //   path: "/people/search",
    //   method: "get",
    //   params,
    // });
  }
}
