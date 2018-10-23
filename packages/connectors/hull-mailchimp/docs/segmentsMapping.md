```javascript

/**
 * Agent managing Mailchimp static segments aka audiences
 * and mapping stored in ships private settings
 */
class segmentsMapping() {

  constructor(mailchimpClient, hullClient, ship) {
    this.mailchimpClient = mailchimpClient;
    this.hullClient = hullClient;
    this.ship = ship;
    this.settingKey = "segment_mapping";
  }

  getMapping() {
    return this.ship.private_settings[this.settingKey];
  }

  /**
   * Updates internal segments mapping
   * @param {Object} mapping
   */
  updateMapping(mapping) {
    const toSave = {
      private_settings: {};
    };
    toSave[this.settingKey] = mapping;
    this.ship.private_settings[this.settingKey] = mapping;
    return this.hullClient.put(this.ship.id, toSave);
  }

  /**
   * Returns ids of segments saved in mapping
   */
  getSegmentIds() {
    return _.keys(this.getMapping());
  }

  /**
   * If provided segment is not saved to mapping, it is created in Mailchimp
   * and saved to the mapping.
   * @param {Object} segment
   * @return {Promise}
   */
  createSegment(segment) {
    const mapping = this.getMapping();
    if (_.get(mapping, segment.id)) {
      return Promise.resolve();
    }

    return this.mailchimpClient
      .post(`/lists/{list_id}/segments`)
      .send({
        name: segment.name,
        static_segment: []
      })
      .then((res) => {
        mapping[segment.id] = res.body.id
        return this.updateMapping(mapping);
      });
  }

  /**
   * Removes audience from Mailchimp and segment from mapping
   * @param {Object} segment
   * @return {Promise}
   */
  deleteSegment(segment) {
    const mapping = this.getMapping();
    if (!_.get(mapping, segment.id)) {
      return Promise.resolve();
    }

    const audienceId = _.get(mapping, segment.id);
    return this.mailchimpClient
      .delete(`/lists/{list_id}/segments/{segment_id}`)
      .then(() => {
        _.unset(mapping, segment.id);
        return this.updateMapping(mapping);
      });
  }

  /**
   * Returns Mailchimp static segment aka Audience for corresponding segment
   * @param {String} segmentId
   * @return {String}
   */
  getAudienceId(segmentId) {
    const mapping = this.getMapping();
    return _.get(mapping, segmentId);
  }

  /**
   * @return {Promise}
   */
  syncSegments(segments) {
    const mappedSegments = this.getSegmentIds().map(id => { return { id }});

    const newSegments = _.differenceBy(segments, mappedSegments, 'id');
    const oldSegments = _.difference(mappedSegments, segments, 'id');

    return Promise.all(newSegments.map(segment => {
      return this.createSegment(segment);
    }))
    .map(oldSegments.map(segment => {
      return this.delete(segment);
    }));
  }
}
```
