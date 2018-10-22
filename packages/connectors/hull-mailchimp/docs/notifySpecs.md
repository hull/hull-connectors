# Send a batch of users to mailchimp

```javascript

/**
 * Handles events of user
 */
userUpdateHandler(req) {
  const { user, changes = {}, segments = [] } = req.payload;
  const { entered = [], left = [] } = changes.segments || {};
  user.segment_ids = user.segment_ids || segments.map(s => s.id);
  user.remove_segment_ids = left.map(s => s.id);

  // batch grouping

  return Promise.all([
    req.shipApp.queueAgent.create("sendUsersJob", { users: [ user ] }),
    req.shipApp.queueAgent.create("trackEventsJob")
}

/**
 * When segment is added or updated make sure its in the segments mapping,
 * and trigger an extract for that segment to update users.
 */
segmentUpdateHandler(req) {
  const { segment } = req.payload;

  return req.shipApp.segmentsMapping.updateSegment(segment)
    .then(() => {
      req.shipApp.hullAgent.requestExtract({ segment });
    });
}

/**
 * Removes deleted segment from Mailchimp and from ship segment
 */
segmentDeleteHandler(req) {
  return req.shipApp.segmentsMapping.deleteSegment(segment);
}

/**
 * Makes sure that all existing Hull segments have mapped Mailchimp static segment
 */
shipUpdateHandler(req) {
  return req.shipApp.hullAgent.getSegment()
    .then(segments => {
      return req.shipApp.segmentsMapping.syncSegments(segments);
    });
}
```
