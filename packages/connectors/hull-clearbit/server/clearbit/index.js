// @flow
import type {
  HullContext,
  HullConnector
  // HullAccountUpdateMessage
} from "hull";
// import _ from "lodash";
import Client from "./client";
import type { ClearbitConnectorSettings } from "../types";
// import { getDomain, now } from "./utils";
// import { discover } from "./discover";
// import { getUserTraitsFrom, getAccountTraitsFromCompany } from "./mapping";
// import { saveDiscovered } from "../lib/side-effects";

// const debug = require("debug")("hull-clearbit:clearbit_class");

export default class Clearbit {
  ctx: HullContext;

  token: string;

  connector: HullConnector;

  metric: $PropertyType<HullContext, "metric">;

  hull: $PropertyType<HullContext, "client">;

  settings: ClearbitConnectorSettings;

  client: Client;

  constructor(ctx: HullContext) {
    const { client, connector, metric, clientCredentialsEncryptedToken } = ctx;
    this.ctx = ctx;
    this.token = clientCredentialsEncryptedToken;
    const { private_settings } = connector;
    this.settings = private_settings;
    if (!connector.private_settings) {
      console.error("MissingPrivateSettingsError", connector); // eslint-disable-line no-console
    }

    const { api_key } = private_settings || {};
    this.hull = client;
    this.metric = metric;

    if (!api_key) {
      throw new Error("No API Key Available");
    }
    this.client = new Client(ctx);
  }

  /** *********************************************************
   * Clearbit Discovery
   */

  /**
   * Find companies similar to a given company
   * @param  {Company} domain - A company domain name
   * @param  {Object} filters - Criteria to use as filters
   * @return {Promise}
   */
  // async discover({ account = {} }: HullAccountUpdateMessage) {
  //   // TODO -> Support Accounts
  //   const domain = getDomain(account);
  //   const { client } = this.ctx;
  //   const asAccount = client.asAccount(account);
  //
  //   try {
  //     // Let's not call the Discovery API if we have already done it before...
  //     const companies = (await discover(account)) || [];
  //     if (!companies || !companies.length) {
  //       asAccount.logger.info("outgoing.account.success", {
  //         reason: "no companies from discovery attempt"
  //       });
  //       return false;
  //     }
  //     if (account.id && !account["clearbit/discovered_similar_companies_at"]) {
  //       asAccount.traits(
  //         {
  //           "clearbit/discovered_similar_companies_at": now()
  //         },
  //         { sync: true }
  //       );
  //     }
  //
  //     const response = await saveDiscovered(this.ctx, { domain, companies });
  //     return response;
  //   } catch (err) {
  //     asAccount.logger.info("outgoing.user.error", {
  //       errors: _.get(err, "message", err)
  //     });
  //     return Promise.reject(err);
  //   }
  // }
}
