// @flow

import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";

import Promise from "bluebird";
import _ from "lodash";
import Datanyze from "./datanyze";
import * as domainUtils from "./domain-utils";

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>,
  { queued = false, attempt = 1, isBatch = false }: any = {}
): HullNotificationResponse => {
  const { connector: ship, client, cache, metric } = ctx;

  return Promise.all(
    messages.map(message => {
      const { user = {}, account, segments = [] } = message;
      const userSegmentIds = _.compact(segments).map(s => s.id);

      const {
        synchronized_segments = [],
        handle_accounts = false,
        target_trait,
        username,
        token,
        excluded_domains = ""
      } = ship.private_settings;

      // Build a target client, which will be
      // either scoped to account or user depending on the manifest setting
      const targetClient = handle_accounts
        ? client.asAccount(account)
        : client.asUser(user);

      const datanyzeAccount = handle_accounts
        ? _.get(client.utils.traits.group(account), "datanyze", {})
        : {};

      const type = handle_accounts ? "account" : "user";

      // All good, let's start
      targetClient.logger.info(`outgoing.${type}.start`);

      const skip = data => {
        targetClient.logger.info(`outgoing.${type}.skip`, data);
        return Promise.resolve();
      };

      // Skip because we don't have a token
      if (!token) return skip({ reason: "token.missing" });

      // Skip because we don't have a username
      if (!username) return skip({ reason: "username.missing" });

      // Skip because we don't have a segment whitelist
      if (!synchronized_segments) {
        return skip({ reason: "synchronized_segments.empty" });
      }

      // Skip because user segments don't match
      const matchingSegments =
        _.intersection(userSegmentIds, synchronized_segments).length > 0;

      if (!matchingSegments && !isBatch) {
        return skip({ reason: "datanyze.user.segments_skip" });
      }

      // Skip because can't find a Domain name to match
      const rawDomain = handle_accounts ? account.domain : user[target_trait];
      const domain = domainUtils.normalize(rawDomain);
      if (!domain) {
        return skip({
          reason: "Could not find a domain",
          handle_accounts,
          rawDomain,
          domain
        });
      }

      // Skip because domain is invalid
      if (!domainUtils.verify(domain)) {
        return skip({
          reason: "Domain invalid",
          domain
        });
      }

      // Skip because we are already enriched
      const rank =
        datanyzeAccount.rank ||
        user["traits_datanyze/rank"] ||
        user["datanyze/rank"];
      if (!!rank && !isBatch && !queued) {
        return skip({
          reason: "Already fetched datanyze/rank"
        });
      }

      // Skip because domain is in the excluded domains list
      const skip_search = _.includes(
        _.map(excluded_domains.split(","), d => d.trim()),
        domain
      );
      if (skip_search) {
        return skip({
          reason: `blacklisted domain, ${domain}`
        });
      }

      // Skip because we already have a Fetched date
      const fetched_at =
        datanyzeAccount.fetched_at ||
        user["traits_datanyze/fetched_at"] ||
        user["datanyze/fetched_at"];

      if (!!fetched_at && !isBatch && !queued) {
        return skip({
          reason: `Already fetched at: ${fetched_at}`
        });
      }

      // Skip because we had an error
      const error =
        datanyzeAccount.error ||
        user["traits_datanyze/error"] ||
        user["datanyze/error"];
      if (error && !isBatch && !queued) {
        return skip({
          reason: "Already fetched datanyze/error",
          error
        });
      }

      const datanyze = new Datanyze({
        email: username,
        token,
        cache,
        logger: targetClient.logger,
        metric
      });

      return datanyze.getDomainInfo(domain).then(
        data => {
          targetClient.logger.debug(`outgoing.${type}.fetch.response`, {
            response: data
          });

          if (!data) {
            targetClient.logger.error(`outgoing.${type}.error`, {
              errors: "No Data"
            });
            return Promise.resolve();
          }
          if (data.error && !data.error.redirect_url) {
            targetClient.logger.error(`outgoing.${type}.error`, {
              errors: data.error
            });

            if (data.error === 103 && attempt <= 2) {
              targetClient.logger.debug(
                `outgoing.${type}.fetch.addDomain.attempt`,
                {
                  attempt
                }
              );

              return datanyze.addDomain(domain).then(
                () => {
                  targetClient.logger.debug(
                    `outgoing.${type}.fetch.addDomain.queue`
                  );

                  return ctx.enqueue(
                    "refetchDomainInfo",
                    {
                      message,
                      attempt
                    },
                    {
                      delay: process.env.ADD_DOMAIN_DELAY || 1800000
                    }
                  );
                },
                err =>
                  targetClient.logger.debug("fetch.addDomain.queue.error", {
                    errors: err
                  })
              );
            }
            targetClient.logger.debug(
              `outgoing.${type}.fetch.addDomain.error`,
              {
                attempt,
                domain,
                errors: data.error
              }
            );
            return Promise.resolve();
          }

          const technologies = _.map(data.technologies, t => t.name);
          const payload = { ...data, technologies };
          payload.fetched_at = new Date().toISOString();
          targetClient.logger.info(`outgoing.${type}.success`);
          metric.increment(`ship.outgoing.${type}s`);

          return targetClient.traits(payload, { source: "datanyze" });
        },
        err => {
          targetClient.logger.error(`outgoing.${type}.error`, {
            errors: err
          });
        }
      );
    })
  ).catch(e => {
    client.logger.debug("outgoing.user.error", { errors: e.stack || e });
  });
};
