// @flow
import type { HullContext, HullStatusResponse } from "hull";

const _ = require("lodash");
const uri = require("urijs");
const Promise = require("bluebird");

const shipAppFactory = require("../lib/ship-app-factory");

async function statusAction(ctx: HullContext): HullStatusResponse {
  const { client, connector, metric } = ctx;
  const shipApp = shipAppFactory(ctx);

  const messages = [];
  let status = "ok";

  return (() => {
    if (!shipApp.syncAgent.isConfigured()) {
      status = "warning";
      messages.push("External service credentials aren’t set.");
      return Promise.resolve({});
    }

    return shipApp.syncAgent
      .isAuthorized()
      .then(isAuthorized => {
        if (isAuthorized === false) {
          status = "error";
          messages.push("External service credentials aren’t valid.");
          return Promise.resolve({});
        }
        return shipApp.syncAgent.isListPresent();
      })
      .then(isListPresent => {
        if (isListPresent === false) {
          status = "error";
          messages.push(
            `Selected Mailchimp list: ${
              connector.private_settings.mailchimp_list_name
            } does not exists.`
          );
          return Promise.resolve({});
        }
        return shipApp.syncAgent.syncConnector({ forceCheck: true });
      })
      .then(() => {
        return shipApp.syncAgent.auditUtil.getAudit();
      })
      .then(audit => {
        const maxSegments = 60;
        const segmentsCount = audit.segmentsStats.length;
        const extraSegmentsCount = maxSegments - segmentsCount;

        const shouldBeSynchronized = audit.segmentsStats
          .filter(
            s =>
              s.shouldBeSynchronized &&
              (!s.mailchimpInterestGroupExists ||
                !s.mailchimpStaticSegmentExists)
          )
          .map(s => s.hullSegmentName);

        if (shouldBeSynchronized.length > extraSegmentsCount) {
          shouldBeSynchronized.slice(extraSegmentsCount);
          messages.push(
            `The following segments can't be sent to MailChimp: **${shouldBeSynchronized.join(
              ", "
            )}**, because the maximum number of 60 synchronised interest groups has been reached in MailChimp.`
          );
        }

        _.map(audit.segmentsStats, segmentStat => {
          if (segmentStat.mailchimpStaticSegmentExists !== true) {
            messages.push(
              `Missing Mailchimp static segment for Hull segment: ${
                segmentStat.hullSegmentName
              }`
            );
            status = "error";
          }
          if (segmentStat.mailchimpInterestGroupExists !== true) {
            messages.push(
              `Missing Mailchimp interest group for Hull segment: ${
                segmentStat.hullSegmentName
              }`
            );
            status = "error";
          }
        });
        return shipApp.mailchimpClient
          .get("/lists/{{listId}}/webhooks")
          .ok(result => result.status === 200)
          .query({
            count: 500
          })
          .then(webhookRes => {
            const { organization, id, secret } = client.configuration();
            const search = {
              organization,
              secret,
              ship: id
            };
            const url = uri(`https://${ctx.hostname}/mailchimp`)
              .search(search)
              .toString();
            const foundWebhooks = _.filter(webhookRes.body.webhooks, { url });
            return { foundWebhooks, audit };
          });
      });
  })()
    .catch(error => {
      status = "error";
      messages.push(
        `Error when trying to get test payload from Mailchimp API: ${
          error.message
        }`
      );
      return Promise.resolve({});
    })
    .then(({ foundWebhooks, audit }) => {
      if (foundWebhooks && foundWebhooks.length === 0) {
        status = "error";
        messages.push("No webhook registered");
      }
      if (foundWebhooks && foundWebhooks.length > 1) {
        status = "error";
        messages.push("More than one webhook registered");
      }

      if (audit) {
        metric.value(
          "mailchimp.mean_sync_percentage",
          audit.meanSyncPercentage
        );
      }

      return {
        status,
        messages,
        audit
      };
    });
}

module.exports = statusAction;
