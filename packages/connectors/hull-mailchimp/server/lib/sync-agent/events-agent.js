const Promise = require("bluebird");
const moment = require("moment");
const _ = require("lodash");
const crypto = require("crypto");

/**
 * EventsAgent has methods to query Mailchimp for data relevant
 * for Hull Track API.
 * TODO: integrate with MailchmpAgent and SyncAgent
 */
class EventsAgent {
  constructor(mailchimpClient, client, ship, metric) {
    this.client = client;
    this.mailchimpClient = mailchimpClient;
    this.metric = metric;
    this.listId = _.get(ship, "private_settings.mailchimp_list_id");
    this.listName = _.get(ship, "private_settings.mailchimp_list_name");
  }

  getCampaignsAndAutomationsToTrack() {
    return Promise.all([
      this.getTrackableCampaigns(),
      this.getTrackableAutomationEmails()
    ]).spread((campaigns, automationEmails) => {
      return campaigns.concat(automationEmails);
    });
  }

  getTrackableAutomationEmails() {
    return this.mailchimpClient
      .get("/automations")
      .query({
        fields: "automations.id,automations.status,automations.send_time"
      })
      .then(({ body }) => {
        const trackableAutomations = _.get(body, "automations", []).filter(
          a => a.status === "sending"
        );
        return trackableAutomations;
      })
      .then(trackableAutomations => {
        return Promise.map(trackableAutomations, automation => {
          return this.mailchimpClient
            .get("/automations/{{automationId}}/emails")
            .tmplVar({
              automationId: automation.id
            })
            .query({
              fields:
                "emails.id,emails.status,emails.send_time,emails.settings.title"
            })
            .then(({ body }) => {
              // TODO: check send_time
              const trackableEmails = _.get(body, "emails", []).filter(
                e => e.status === "sending"
              );
              return trackableEmails;
            });
        });
      })
      .then(emailsPerAutomation => _.flatten(emailsPerAutomation));
  }

  /**
   * Returns an array of campaigns which can have new events from members.
   * This are sent and being sent campaign not older than a week.
   * @return {Promise}
   */
  getTrackableCampaigns() {
    this.client.logger.debug("getTrackableCampaigns");
    const weekAgo = moment().subtract(1, "week");

    return this.mailchimpClient
      .get("/campaigns")
      .query({
        fields:
          "campaigns.id,campaigns.status,campaigns.title,campaigns.send_time,campaigns.settings.title",
        list_id: this.listId,
        since_send_time: weekAgo.format()
      })
      .then(response => {
        const res = response.body;
        const trackableCampaigns = _.get(res, "campaigns", []).filter(
          c => ["sent", "sending"].indexOf(c.status) !== -1
        );
        this.metric.value("trackable_campaigns", trackableCampaigns.length);
        return trackableCampaigns;
      });
  }

  /**
   * Takes a list of campaigns to check, then prepares operation to download
   * the email activites for these campaigns.
   * @param  {Array} campaigns
   * @return {Array}
   */
  getEmailActivitiesOps(campaigns) {
    this.client.logger.debug("getEmailActivities", campaigns);
    return campaigns.map(c => {
      return {
        method: "GET",
        path: `/reports/${c.id}/email-activity/`,
        params: {
          exclude_fields: "_links"
        }
      };
    });
  }

  /**
   * This method downloads from Mailchimp information for members.
   * If the latest activity infromation is provided for an user the returned
   * array will be filtered to include only events which happened after the time.
   * The array provided as param needs two required parameters:
   * - `email_address` (user email address)
   * - `id` (Hull user ID)
   * It also can take optional params:
   * - `email_id` the MD5 of the `email_address`
   * - `mailchimp/latest_activity_at` if provided it will be used to filter
   * the returned array
   * @param  {Array} emails
   * [{ email_address, id, [[email_id,] "mailchimp/latest_activity_at"] }]
   * @return {Promise}
   */
  getMemberActivities(users) {
    this.client.logger.debug("getMemberActivities", users.length);
    return Promise.map(
      users,
      e => {
        e.email_id = e.email_id || this.getEmailId(e.email);
        return this.mailchimpClient
          .get("/lists/{{listId}}/members/{{emailId}}/activity")
          .tmplVar({ emailId: e.email_id })
          .query({
            exclude_fields: "_links"
          })
          .then(res => {
            return _.merge(res.body, { email_address: e.email });
          });
      },
      { concurrency: 3 }
    );
  }

  getEmailId(email) {
    return (
      !_.isEmpty(email) &&
      crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex")
    );
  }

  /**
   * For every provided email and its activity call Hull Track endpoint.
   * After calling the track endpoint it saves the latest event timestamp
   * as `mailchimp/latest_activity_at`.
   * @param  {Array} emails
   * [{
   *   activity: [{
   *     action: "bounce",
   *     type: "hard",
   *     title: "Campaign Title",
   *     timestamp: "",
   *     campaign_id: "123",
   *     ip: "123.123.123.123"
   *   }],
   *   id: "578fc6e644d74b10070043be",
   *   email_id: "039817b3448c634bfb35f33577e8b2b3",
   *   list_id: "319f54214b",
   *   email_address: "michaloo+4@gmail.com"
   * }]
   * @return {Promise}
   */
  trackEvents(emails) {
    this.client.logger.debug("trackEvents", emails.length);
    this.metric.increment("ship.incoming.events", emails.length);
    const emailTracks = emails.map(email => {
      const asUser = this.client.asUser({
        email: email.email_address
      });
      return Promise.all(
        email.activity.map(a => {
          const uniqId = this.getUniqId({ email, activity: a });
          const eventName = this.getEventName(a);
          const props = this.getEventProperties(a, email);

          return asUser
            .track(eventName, props, {
              source: "mailchimp",
              event_id: uniqId,
              created_at: a.timestamp
            })
            .then(
              () => {
                asUser.logger.info("incoming.event.success", {
                  email: email.email_address,
                  action: a.action,
                  timestamp: a.timestamp,
                  uniqId
                });
              },
              error => {
                asUser.logger.info("incoming.event.error", {
                  errors: error
                });
              }
            );
        })
      );
    });

    return Promise.all(emailTracks);
  }

  /**
   * @type {Array}
   * @param emailActivites
   * @param last_track_at
   */
  filterEvents(emailActivites, last_track_at = null) {
    if (last_track_at) {
      emailActivites = emailActivites.map(e => {
        e.activity = _.get(e, "activity", []).filter(a => {
          return moment(a.timestamp)
            .utc()
            .isAfter(last_track_at);
        });
        return e;
      });
    }

    emailActivites = emailActivites.filter(e => !_.isEmpty(e.activity));

    return emailActivites;
  }

  /**
   * Generate unique id for an event
   * @param  {Object} email
   * @param  {Object} activity
   * @return {String}
   */
  getUniqId({ email, activity }) {
    return [email.email_id, activity.action, activity.timestamp].join("-");
  }

  /**
   * Implements events nameing from Segment documentation.
   * Mailchimp doesn't provide information for `Email Marked as Spam`
   * and `Email Delivered` events.
   * @see https://segment.com/docs/spec/email/#email-delivered
   * @param  {Object} activity
   * @return {String}
   */
  getEventName(activity) {
    const map = {
      open: "Email Opened",
      sent: "Email Sent",
      bounce: "Email Bounced",
      click: "Email Link Clicked",
      unsub: "Unsubscribed"
    };

    return _.get(map, activity.action, activity.action);
  }

  /**
   * Implements data structure from Segment documentation.
   *
   * @param  {Object} activity
   * @param email
   * @return {Object}
   */
  getEventProperties(activity, email) {
    const defaultProps = {
      timestamp: activity.timestamp,
      campaign_name: activity.title || email.title || "",
      campaign_id: activity.campaign_id,
      list_id: email.list_id,
      list_name: this.listName,
      ip: "0"
      // TODO add ip, available here:
      // http://developer.mailchimp.com/documentation/mailchimp/reference/reports/email-activity
      // TODO add email_subject, available here:
      // http://developer.mailchimp.com/documentation/mailchimp/reference/campaigns/#read-get_campaigns
      // campaings.settings.subject_line
    };
    const props = {};

    switch (activity.action) {
      case "click":
        _.defaults(props, defaultProps, {
          link_url: activity.url
        });
        break;
      case "bounce":
        _.defaults(props, defaultProps, {
          type: activity.type
        });
        break;
      default:
        _.defaults(props, defaultProps);
    }

    return props;
  }
}

module.exports = EventsAgent;
