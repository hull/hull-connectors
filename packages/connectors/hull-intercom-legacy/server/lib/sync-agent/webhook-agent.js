const _ = require("lodash");
const uri = require("urijs");
const Promise = require("bluebird");

class WebhookAgent {
  constructor(intercomAgent, client, ship, helpers, hostname, cache) {
    this.ship = ship;
    this.client = client;
    this.helpers = helpers;
    this.intercomClient = intercomAgent.intercomClient;
    this.hostname = hostname;
    this.cache = cache;

    this.webhookId = _.get(this.ship, "private_settings.webhook_id");

    this.topics = [
      "user.created",
      "user.deleted",
      "user.tag.created",
      "user.tag.deleted",
      "contact.tag.created",
      "contact.tag.deleted",
      "user.unsubscribed",
      "conversation.user.created",
      "conversation.user.replied",
      "conversation.admin.replied",
      "conversation.admin.single.created",
      "conversation.admin.assigned",
      "conversation.admin.opened",
      "conversation.admin.closed",
      "user.email.updated",
      "contact.created",
      "contact.signed_up",
      "contact.added_email"
    ];
  }

  getExistingWebhook() {
    this.client.logger.debug("connector.getExistingWebhooks");
    return this.intercomClient.get("/subscriptions/").then(response => {
      const webhooks = _.get(response, "body.items", []);

      const existingWebhooks = [];
      _.forEach(webhooks, webhook => {
        const url = webhook.url;
        if (url.indexOf(this.ship.id) >= 0) {
          existingWebhooks.push(webhook);
        }
      });

      if (existingWebhooks.length === 0) {
        return Promise.resolve();
      }
      if (existingWebhooks.length === 1) {
        return Promise.resolve(existingWebhooks[0]);
      }

      const sortedWebhooks = _.sortBy(existingWebhooks, ["created_at"]);

      const latestWebhook = _.last(sortedWebhooks);
      const webhooksToDelete = _.slice(sortedWebhooks, 0, -1);

      return Promise.all(
        webhooksToDelete.map(webhook => {
          return this.deleteWebhook(webhook.id);
        })
      ).then(() => {
        return Promise.resolve(latestWebhook);
      });
    });
  }

  deleteWebhook(webhookId) {
    this.client.logger.debug("connector.deletingWebhook", { webhookId });
    return this.intercomClient
      .delete(`/subscriptions/${webhookId}`)
      .then(response => {
        return Promise.resolve(response.body);
      });
  }

  getCachedOrLiveWebhook() {
    this.client.logger.debug("connector.getWebhook");
    return this.cache.get("intercom-webhook").then(webhook => {
      if (!webhook) {
        this.client.logger.debug("connector.getWebhook.cachemiss");
        return this.getExistingWebhook().then(existingWebhook => {
          if (existingWebhook) {
            return this.cache
              .set("intercom-webhook", existingWebhook)
              .then(() => {
                return Promise.resolve(existingWebhook);
              });
          }
          return Promise.resolve(existingWebhook);
        });
      }

      return Promise.resolve(webhook);
    });
  }

  /**
   * @return Promise
   * I don't like how we're playing around with passing webhookid and using the class level one...
   */
  ensureWebhook() {
    // This logic does not guard against deleting a connector then reinstalling
    // If that happens we create multiple webhooks...
    return this.getCachedOrLiveWebhook().then(
      body => {
        // this is the case where we can't find a webhook in the cach
        // or on through the api, so create a new one
        if (!body || body === null) {
          return this.createOrUpdateWebhook();
        }

        // this is the case where we found a webhook in the cache or api
        // but it's either not in the private_settings or it's on the same one in the settings
        // either case, make sure it's up to date in the api, and make sure we send it to the settings
        // this is the problematic case where we could get a message from kraken
        // with no webhookid, but it was actually created with a previous message
        // now, we won't create a new webhook like we were doing in the past
        // just synching the one from the cache and sending it back to settings
        if (!this.webhookId || this.webhookId !== body.id) {
          this.client.logger.debug(
            "Settings Cache and API are out of sync, could be Kraken delay",
            { webhookId: this.webhookId, existingId: body.id }
          );
          return this.createOrUpdateWebhook(body.id);
        }

        // this just creates a new webhook if the topics are different
        // need to delete old one...
        const missingTopics = _.difference(this.topics, body.topics);
        if (!_.isEmpty(missingTopics)) {
          return this.createOrUpdateWebhook(this.webhookId);
        }

        return Promise.resolve(this.webhookId);
      },
      error => {
        if (error.status === 404) {
          return this.createOrUpdateWebhook();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Creates or updates webhook
   * @type {String} webhookId optional id of existing webhook
   */
  createOrUpdateWebhook(webhookId = "") {
    const url = this.getWebhookUrl();

    return this.intercomClient
      .post("/subscriptions/{{webhookId}}", {
        service_type: "web",
        topics: this.topics,
        url
      })
      .tmplVar({
        webhookId
      })
      .then(res => {
        this.webhookId = res.body.id;
        return this.cache.set("intercom-webhook", res.body).then(() => {
          return this.helpers.settingsUpdate({
            webhook_id: this.webhookId
          });
        });
      })
      .catch(error => {
        if (error.status === 500) {
          if (_.isEmpty(webhookId)) {
            this.client.logger.error(
              "Intercom threw an Internal Server Error when trying to create webhook for incoming data"
            );
          } else {
            this.client.logger.debug(
              "Webhook exists in intercom, but getting a 500 when trying to synchronize webhook with intercom"
            );
          }

          return Promise.resolve();
        }

        return Promise.reject(error);
      });
  }

  getWebhookUrl() {
    const { organization, id, secret } = this.client.configuration();
    const search = {
      organization,
      secret,
      ship: id
    };
    return uri(`https://${this.hostname}/intercom`)
      .search(search)
      .toString();
  }
}

module.exports = WebhookAgent;
