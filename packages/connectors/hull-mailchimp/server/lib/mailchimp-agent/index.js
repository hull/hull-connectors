const crypto = require("crypto");
const _ = require("lodash");
const uri = require("urijs");
const Promise = require("bluebird");
const { ConfigurationError } = require("hull/src/errors");

const MailchimpBatchAgent = require("./batch-agent");

/**
 * Class responsible for working on data in Mailchimp
 */
class MailchimpAgent {
  constructor(mailchimpClient, ctx) {
    this.mailchimpClient = mailchimpClient;
    this.client = ctx.client;
    this.ship = ctx.ship;
    this.cache = ctx.cache;
    this.listId = _.get(ctx.connector, "private_settings.mailchimp_list_id");

    this.batchAgent = new MailchimpBatchAgent(ctx, mailchimpClient);
  }

  getEmailHash(email) {
    return (
      !_.isEmpty(email) &&
      crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex")
    );
  }

  getWebhook({ hostname, client }) {
    const ship = _.get(client.configuration(), "id");
    return this.mailchimpClient
      .get("/lists/{{listId}}/webhooks")
      .then(response => {
        const { body } = response;
        if (response.statusCode === 404) {
          return Promise.reject(
            new ConfigurationError("Mailchimp list is not present")
          );
        }
        // console.log(response);
        const { webhooks = [] } = body;
        return _.find(webhooks, ({ url = "" }) => {
          return url && url.includes(ship) && url.includes(hostname);
        });
      });
  }

  createWebhook(ctx) {
    const { hostname } = ctx;
    const { organization, id, secret } = ctx.client.configuration();
    const search = {
      organization,
      secret,
      ship: id
    };
    const url = uri(`https://${hostname}/mailchimp`)
      .search(search)
      .toString();

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

  ensureWebhookSubscription(req) {
    if (!this.listId) {
      return Promise.reject(new Error("Missing listId"));
    }
    return this.cache
      .wrap("webhook", () => this.getWebhook(req))
      .then(hook => {
        return hook || this.createWebhook(req);
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
