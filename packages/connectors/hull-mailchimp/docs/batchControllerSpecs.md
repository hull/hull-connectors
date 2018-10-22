# Send a batch of users to mailchimp

```javascript

handleBatchExtractAction(req, res) {
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
handleBatchExtractJob(req) {

  return req.shipApp.hullAgent.handleExtract(req.payload.body, req.payload.chunkSize, (users) => {
    if (req.payload.segmentId) {
      users = users.map(u => {
        u.segment_ids = _.uniq(_.concat(u.segment_ids || [], [req.payload.segmentId]));
        return u;
      });
    }
    return req.shipApp.queueAgent.create("sendUsersJob", { users });
  });
}
```
