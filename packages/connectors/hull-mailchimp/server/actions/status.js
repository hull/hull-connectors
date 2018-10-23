const _ = require("lodash");
const uri = require("urijs");
const Promise = require("bluebird");

function statusAction(req, res) {
  const { client, ship, shipApp, metric } = req.hull;

  const messages = [];
  let status = "ok";

  (() => {
    if (!shipApp.syncAgent.isConfigured()) {
      status = "warning";
      messages.push("External service credentials aren’t set.");
      return Promise.resolve({});
    }

    return shipApp.syncAgent.auditUtil.getAudit().then(audit => {
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
      return req.hull.shipApp.mailchimpClient
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
          const url = uri(`https://${req.hostname}/mailchimp`)
            .search(search)
            .toString();
          const foundWebhooks = _.filter(webhookRes.body.webhooks, { url });
          return { foundWebhooks, audit };
        });
    });
  })()
    .catch(() => {
      status = "error";
      messages.push("Error when trying to get test payload from Mailchimp API");
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

      res.json({
        status,
        messages,
        audit
      });
      metric.value("mailchimp.mean_sync_percentage", audit.meanSyncPercentage);
      return client.put(`${ship.id}/status`, { status, messages });
    });
}

module.exports = statusAction;
