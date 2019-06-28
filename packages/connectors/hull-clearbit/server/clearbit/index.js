// @flow
import type {
  HullContext,
  HullAccount,
  HullUser,
  HullConnector,
  HullAccountUpdateMessage,
  HullUserUpdateMessage
} from "hull";
import _ from "lodash";
import Client from "./client";

import { getDomain, now } from "./utils";
import { shouldProspect, shouldProspectDomain, prospect } from "./prospect";
import { shouldEnrich, enrich } from "./enrich";
import { shouldDiscover, discover } from "./discover";
import { shouldReveal, reveal } from "./reveal";
// import { getUserTraitsFrom, getAccountTraitsFromCompany } from "./mapping";
import {
  saveProspect,
  saveAccount,
  saveUser,
  saveDiscovered
} from "../lib/side-effects";

// const debug = require("debug")("hull-clearbit:clearbit_class");

const FILTERED_ERRORS = ["unknown_ip"];
type Settings = {
  api_key: string,

  enrich_segments: Array<string>,

  discover_limit_count: number,
  discover_segments: Array<string>,

  prospect_segments: Array<string>,
  prospect_filter_role: Array<string>,
  prospect_filter_seniority: Array<string>,
  prospect_filter_titles: Array<string>,
  prospect_limit_count: number,

  reveal_prospect_min_contacts: number,
  reveal_segments: Array<string>
};
export default class Clearbit {
  ctx: HullContext;

  token: string;

  connector: HullConnector;

  metric: $PropertyType<HullContext, "metric">;

  hull: $PropertyType<HullContext, "client">;

  settings: Settings;

  client: Client;

  constructor(ctx: HullContext) {
    const { client, connector, metric, clientCredentialsEncryptedToken } = ctx;
    this.ctx = ctx;
    this.token = clientCredentialsEncryptedToken;
    const { private_settings = {} } = connector;

    if (!connector.private_settings) {
      console.error("MissingPrivateSettingsError", connector); // eslint-disable-line no-console
    }

    const { api_key } = private_settings || {};
    this.hull = client;
    this.metric = metric;

    if (!api_key) {
      throw new Error("No API Key Available");
    }
    this.client = new Client(api_key, metric, client);
  }

  getDomain(account: HullAccount, user: HullUser) {
    return getDomain(account, user, "domain");
  }

  /** *********************************************************
   * Clearbit Enrichment
   */

  shouldEnrich(message: HullUserUpdateMessage) {
    return this.shouldLogic(message, shouldEnrich);
  }

  shouldReveal(message: HullUserUpdateMessage) {
    return this.shouldLogic(message, shouldReveal);
  }

  shouldProspect(message: HullAccountUpdateMessage) {
    return this.shouldLogic(message, shouldProspect);
  }

  shouldDiscover(message: HullAccountUpdateMessage) {
    return this.shouldLogic(message, shouldDiscover);
  }

  shouldLogic(
    message: HullAccountUpdateMessage | HullUserUpdateMessage,
    action: (Settings, any) => any
  ) {
    return action(this.settings, message);
  }

  async enrich(message: HullUserUpdateMessage = {}) {
    const { user, account } = message;
    try {
      this.metric.increment("enrich");
      const response = await enrich({
        settings: this.settings,
        token: this.token,
        client: this.client,
        message
      });
      if (!response || !response.source) return false;
      const { person, company, source } = response;
      await Promise.all([
        user && saveUser(this.ctx, { user, person, source }),
        account && saveAccount(this.ctx, { user, account, company, source })
      ]);
    } catch (err) {
      this.hull.asUser(user).logger.info("outgoing.user.error", {
        errors: err,
        method: "enrichUser"
      });
      throw err;
    }
    return undefined;
  }

  async reveal(message: HullUserUpdateMessage = {}) {
    const { user, account } = message;
    const asUser = this.hull.asUser(user);
    try {
      this.metric.increment("reveal");
      const response = await reveal({
        settings: this.settings,
        client: this.client,
        message
      });
      if (!response || !response.source) return false;
      const { company, source, ip } = response;
      await Promise.all([
        saveUser(this.ctx, { user, source }),
        saveAccount(
          this.ctx,
          { account, user, company, source },
          {
            company: _.pick(company, "name", "domain"),
            ip
          }
        )
      ]);
    } catch (err) {
      // we filter error messages
      if (!_.includes(FILTERED_ERRORS, err.type)) {
        asUser.logger.info("outgoing.user.error", {
          errors: err,
          method: "revealUser"
        });
      }
      throw err;
    }
    return undefined;
  }

  async prospect(message: HullAccountUpdateMessage = {}) {
    const { account } = message;
    const scope = account ? this.hull.asAccount(account) : this.hull;

    // const asAccount = this.hull.asAccount(account);
    const logError = error => {
      scope.logger.info("outgoing.account.error", {
        errors: _.get(error, "message", error),
        method: "prospectUser"
      });
    };

    // Since user update logic is synchronous,
    // There is a second, asynchronous part of checks in here.
    const { should, message: msg } = await shouldProspectDomain({
      domain: this.getDomain(account),
      hull: this.hull,
      settings: this.settings
    });

    if (!should) {
      logError(msg);
      return Promise.reject(msg);
    }

    try {
      this.metric.increment("prospect");
      const { prospects, query } = await prospect({
        message,
        client: this.client,
        settings: this.settings
      });
      const log = {
        source: "prospector",
        message: `Found ${_.size(prospects)} new Prospects`,
        ...query,
        prospects
      };

      scope.logger.info("outgoing.user.success", log);

      // If we're scoped as Hull (and not as a User)
      // - when coming from the Prospector UI, then we can't add Track & Traits.
      if (scope.traits) {
        scope.traits({
          "clearbit/prospected_at": { value: now(), operation: "setIfNull" }
        });
      }

      if (scope.track) {
        scope.track(
          "Clearbit Prospector Triggered",
          {
            ..._.mapKeys(query, (v, k) => `query_${k}`),
            found: _.size(prospects),
            emails: _.keys(prospects)
          },
          { ip: 0 }
        );
      }
      return Promise.all(
        prospects.map(person => saveProspect(this.ctx, { account, person }))
      );
    } catch (err) {
      logError(err);
      return Promise.reject(err);
    }
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
  async discover({ account = {} }: HullAccountUpdateMessage) {
    // TODO -> Support Accounts
    const domain = getDomain(account);
    const { client } = this.ctx;
    const asAccount = client.asAccount(account);

    try {
      // Let's not call the Discovery API if we have already done it before...
      const companies = (await discover(account)) || [];
      if (!companies || !companies.length) {
        asAccount.logger.info("outgoing.account.success", {
          reason: "no companies from discovery attempt"
        });
        return false;
      }
      if (account.id && !account["clearbit/discovered_similar_companies_at"]) {
        asAccount.traits(
          {
            "clearbit/discovered_similar_companies_at": now()
          },
          { sync: true }
        );
      }

      const response = await saveDiscovered(this.ctx, { domain, companies });
      return response;
    } catch (err) {
      asAccount.logger.info("outgoing.user.error", {
        errors: _.get(err, "message", err)
      });
      return Promise.reject(err);
    }
  }
}
