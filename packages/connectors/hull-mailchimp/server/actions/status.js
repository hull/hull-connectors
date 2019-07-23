// @flow
import type { HullContext, HullStatusResponse } from "hull";
import _ from "lodash";
import uri from "urijs";

const shipAppFactory = require("../lib/ship-app-factory");

async function statusAction(ctx: HullContext): HullStatusResponse {
  const { client, connector, metric } = ctx;
  const { private_settings = {} } = connector;
  const { mailchimp_list_name } = private_settings;

  const shipApp = shipAppFactory(ctx);

  const messages = [];
  let status = "ok";
  try {
    if (!shipApp.syncAgent.isAuthorizationConfigured()) {
      // status = "warning";
      // messages.push("External service credentials aren’t set.");
      return {
        status: "setupRequired",
        messages: [
          'Please proceed to the settings page and click the "Login to your Mailchimp account" button to authenticate this connector'
        ]
      };
    }

    if (!shipApp.syncAgent.isListConfigured()) {
      return {
        status: "setupRequired",
        messages: ["Please select a Mailchimp list to synch with"]
      };
    }

    const isAuthorized = await shipApp.syncAgent.isAuthorized();
    if (isAuthorized === false) {
      status = "error";
      messages.push("External service credentials aren’t valid.");
    }

    const isListPresent = shipApp.syncAgent.isListPresent();
    if (isListPresent === false) {
      status = "error";
      messages.push(
        `Selected Mailchimp list: ${mailchimp_list_name} does not exists.`
      );
    }

    await shipApp.syncAgent.syncConnector({ forceCheck: true });
    const audit = await shipApp.syncAgent.auditUtil.getAudit();

    const maxSegments = 60;
    const segmentsCount = audit.segmentsStats.length;
    const extraSegmentsCount = maxSegments - segmentsCount;
    const shouldBeSynchronized = audit.segmentsStats
      .filter(
        s =>
          s.shouldBeSynchronized &&
          (!s.mailchimpInterestGroupExists || !s.mailchimpStaticSegmentExists)
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
          `Missing Mailchimp static segment for Hull segment: ${segmentStat.hullSegmentName}`
        );
        status = "error";
      }
      if (segmentStat.mailchimpInterestGroupExists !== true) {
        messages.push(
          `Missing Mailchimp interest group for Hull segment: ${segmentStat.hullSegmentName}`
        );
        status = "error";
      }
    });
    const webhookRes = await shipApp.mailchimpClient
      .get("/lists/{{listId}}/webhooks")
      .ok(result => result.status === 200)
      .query({ count: 500 });
    const { organization, id, secret } = client.configuration();
    const url = uri(`https://${ctx.hostname}/mailchimp`)
      .search({ organization, secret, ship: id })
      .toString();
    const foundWebhooks = _.filter(webhookRes.body.webhooks, { url });

    if (foundWebhooks && foundWebhooks.length === 0) {
      status = "error";
      messages.push("No webhook registered");
    }
    if (foundWebhooks && foundWebhooks.length > 1) {
      status = "error";
      messages.push("More than one webhook registered");
    }

    if (audit) {
      metric.value("mailchimp.mean_sync_percentage", audit.meanSyncPercentage);
    }

    return {
      status,
      messages,
      audit
    };
  } catch (error) {
    status = "error";
    messages.push(
      `Error when trying to get test payload from Mailchimp API: ${error.message}`
    );
    return {
      status,
      messages
    };
  }
}

module.exports = statusAction;
