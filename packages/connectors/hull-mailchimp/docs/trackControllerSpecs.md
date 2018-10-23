# Send a batch of users to mailchimp

```javascript

handleTrackRequestJob(req) {
  return req.shipApp.eventsAgent.runCampaignStrategy()
    .then(operations => this.mailchimpBatchAgent.create(operations));

  // (query => {
  //   req.shipApp.hull.client.logger.info("Request track extract");
  //   const reqOptions = {
  //     segment: {
  //       query
  //     },
  //     path: "/track",
  //     format: "csv",
  //     fields: [
  //       "id",
  //       "email",
  //       "traits_mailchimp/latest_activity_at",
  //       "traits_mailchimp/unique_email_id"
  //     ]
  //   };
  //   return req.shipApp.hullAgent.requestExtract(reqOptions)
  //   .catch(err => console.error(err));
  // });
}

handleEmailsActivitiesJob(req) {

  console.log(req.payload);
  // const emailsToExtract = chunk.reduce((emails, e) => {
  //   const timestamps = e.activity.sort((x, y) => moment(x.timestamp) - moment(y.timestamp));
  //   const timestamp = _.get(_.last(timestamps), "timestamp", e.campaign_send_time);
  //
  //   // if there is already same email queued remove it if its older than
  //   // actual or stop if it's not
  //   const existingEmail = _.findIndex(emails, ["email_address", e.email_address]);
  //   if (existingEmail !== -1) {
  //     if (moment(emails[existingEmail].timestamp).isSameOrBefore(timestamp)) {
  //       _.pullAt(emails, [existingEmail]);
  //     } else {
  //       return emails;
  //     }
  //   }
  //
  //   this.hull.logger.info("runCampaignStrategy.email", { email_address: e.email_address, timestamp });
  //   emails.push({
  //     timestamp,
  //     email_id: e.email_id,
  //     email_address: e.email_address
  //   });
  //   return emails;
  // }, []);
}

handleTrackExtractAction(req, res) {
  const segmentId = req.query.segment_id || null;
  return req.shipApp.queueAgent.create("handleBatchExtractJob", {
    body: req.body,
    chunkSize: 100,
    segmentId
  })
  .then(() => res.end("ok"));
}

/**
 * Handles extract sent from Hull with optional setting selected segment_id
 */
handleTrackExtractJob(req) {

  return req.shipApp.hullAgent.handleExtract(req.payload.body, req.payload.chunkSize, (users) => {
    return req.shipApp.queueAgent.create("trackUsersJob", { users });
  });
}

trackUsersJob(req) {
  return agent.getEventsAgent().runUserStrategy(users)
    .then(() => res.end("ok"));
}
```
