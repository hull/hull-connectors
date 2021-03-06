const crypto = require("crypto");
const _ = require("lodash");
const uri = require("urijs");
const Promise = require("bluebird");

const MailchimpBatchAgent = require("./batch-agent");

/**
 * Class responsible for working on data in Mailchimp
 */
class MailchimpAgent {
  constructor(mailchimpClient, ctx) {
    this.mailchimpClient = mailchimpClient;
    this.private_settings = ctx.connector.private_settings;
    this.settingsUpdate = ctx.helpers.settingsUpdate;
    this.client = ctx.client;
    this.ship = ctx.connector;
    this.cache = ctx.cache;
    this.listId = _.get(ctx.connector, "private_settings.mailchimp_list_id");

    this.batchAgent = new MailchimpBatchAgent(ctx, mailchimpClient);
  }

  getEmailHash(email) {
    return (
      !_.isEmpty(email) &&
      crypto.createHash("md5").update(email.toLowerCase()).digest("hex")
    );
  }

  getWebhooks() {
    return this.mailchimpClient
      .get("/lists/{{listId}}/webhooks")
      .then(response => response.body.webhooks);
  }

  createWebhook(url) {
    const hook = {
      url,
      sources: { user: true, admin: true, api: true },
      events: {
        subscribe: true,
        unsubscribe: true,
        profile: true,
        cleaned: true,
        campaign: true
      }
    };

    return this.mailchimpClient
      .post("/lists/{{listId}}/webhooks")
      .send(hook)
      .then(({ body }) => body);
  }

  deleteWebhook(id) {
    return this.mailchimpClient
      .delete(`/lists/{{listId}}/webhooks/${id}`)
      .then(res => res.body)
      .catch(err => {
        console.log(err);
      });
  }

  /*
      1. Create webhook url template and organization url
      2. Get all webhooks in a list
          If none of them matches the url template, add webhook
      3. Iterate over all webhooks
          If elem isn't equal to url template and includes organization url, delete
   */
  ensureWebhookSubscription(req) {
    if (!this.listId) {
      return Promise.reject(new Error("Missing listId"));
    }
    const webhook_id = _.get(this.private_settings, "webhook_id");

    if (webhook_id) {
      return Promise.resolve({ webhook_id });
    }
    return this.cache
      .wrap("webhook", () => this.getWebhooks(req))
      .then(async webhooks => {
        const promises = [];
        const { organization, id, secret } = req.client.configuration();
        const { hostname } = req;
        const search = {
          organization,
          secret,
          ship: id
        };
        const webhookUrl = uri(`https://${hostname}/mailchimp`)
          .search(search)
          .toString();
        if (_.filter(webhooks, { url: webhookUrl }) <= 0) {
          try {
            const webhook = await this.createWebhook(webhookUrl);
            if (webhook.id) {
              await this.settingsUpdate({ webhook_id: webhook.id });
            }
          } catch (error) {
            this.client.logger.warn("webhook.error", {
              errors: error.message,
              message: "Unable to create webhook"
            });
          }
        }
        _.forEach(webhooks, wh => {
          if (wh.url !== webhookUrl && wh.url.includes(organization)) {
            promises.push(this.deleteWebhook(wh.id));
          }
        });
        return Promise.all(promises);
      })
      .catch(err => {
        this.client.logger.warn("webhook.error", {
          errors: err.message,
          step: "creating"
        });
        return Promise.reject(err);
      });
  }

  getMergeFields() {
    return this.mailchimpClient
      .get("/lists/{{listId}}/merge-fields")
      .query({
        count: 50,
        fields: "merge_fields.name,merge_fields.tag"
      })
      .then(({ body }) => body)
      .catch(err => {
        this.client.logger.warn("webhook.error", {
          errors: err.message,
          step: "getting merge fields"
        });
        return Promise.reject(this.mailchimpClient.handleError(err));
      });
  }
}

module.exports = MailchimpAgent;
