// //@flow
//
// import type  } from "hull";

const _ = require("lodash");
const Promise = require("bluebird");
const debug = require("debug")("hull-mailchimp:segments-mapping-util");

/**
 * Agent managing Mailchimp static segments aka audiences
 * and mapping stored in ships private settings
 * TODO: integrate with SyncAgent
 */
class SegmentsMappingUtil {
  constructor(mailchimpClient, ship, helpers) {
    this.mailchimpClient = mailchimpClient;
    this.ship = ship;
    this.helpers = helpers;
    this.mapping = _.get(this.ship, "private_settings.segment_mapping", {});
    this.originalMapping = _.cloneDeep(this.mapping);
  }

  /**
   * Updates internal segments mapping
   * @param {Object} mapping
   */
  updateMapping() {
    debug("updateMapping", this.originalMapping, this.mapping);
    if (_.isEqual(this.originalMapping, this.mapping)) {
      return Promise.resolve();
    }
    return this.helpers.settingsUpdate({
      segment_mapping: this.mapping
    });
    // this.ship.private_settings[this.settingKey] = this.mapping;
    // return this.client.put(this.ship.id, { private_settings: this.ship.private_settings });
  }

  /**
   * Returns ids of segments saved in mapping
   */
  getSegmentIds() {
    return _.keys(this.mapping);
  }

  getMailchimpSegments() {
    if (this._segmentsRes) {
      return Promise.resolve(this._segmentsRes);
    }
    return this.mailchimpClient
      .get("/lists/{{listId}}/segments")
      .query({
        type: "static",
        count: 500
      })
      .then(res => {
        this._segmentsRes = res;
        return res;
      });
  }

  recreateSegment(segment) {
    const steps = ["deleteSegment", "createSegment", "updateMapping"];
    return Promise.mapSeries(steps, step => this[step](segment));
  }

  findSegment(segment) {
    return this.getMailchimpSegments().then(res => {
      const { segments } = res.body;
      const existingMailchimpSegment = _.find(segments, staticSegment => {
        return segment.name.toLowerCase() === staticSegment.name.toLowerCase();
      });
      return existingMailchimpSegment;
    });
  }

  /**
   * If provided segment is not saved to mapping, it is created in Mailchimp
   * and saved to the mapping.
   * @param {Object} segment
   * @return {Promise}
   */
  createSegment(segment) {
    debug("createSegment", segment);
    return this.findSegment(segment).then(existingMailchimpSegment => {
      debug("existingMailchimpSegment", existingMailchimpSegment);
      if (existingMailchimpSegment) {
        this.mapping[segment.id] = existingMailchimpSegment.id;
        return Promise.resolve();
      }
      return this.mailchimpClient
        .post("/lists/{{listId}}/segments")
        .send({
          name: segment.name,
          static_segment: []
        })
        .then(res => {
          this.mapping[segment.id] = res.body.id;
          return Promise.resolve();
        });
    });
  }

  /**
   * Removes audience from Mailchimp and segment from mapping
   * @param {Object} segment
   * @return {Promise}
   */
  deleteSegment(segment) {
    if (!_.get(this.mapping, segment.id)) {
      return Promise.resolve();
    }
    const audienceId = _.get(this.mapping, segment.id);
    return this.mailchimpClient
      .delete("/lists/{{listId}}/segments/{{audienceId}}")
      .tmplVar({ audienceId })
      .then(
        () => {
          _.unset(this.mapping, segment.id);
          return Promise.resolve();
        },
        err => {
          if (err.response.statusCode === 404) {
            _.unset(this.mapping, segment.id);
            return Promise.resolve();
          }
          return Promise.reject(err);
        }
      );
  }

  /**
   * Returns Mailchimp static segment aka Audience for corresponding segment
   * @param {String} segmentId
   * @return {String}
   */
  getAudienceId(segmentId) {
    return _.get(this.mapping, segmentId);
  }

  /**
   * @return {Promise}
   */
  syncSegments(segments = [], { check = false } = {}) {
    const mapping = check === true ? {} : this.mapping;
    const mappedSegments = _.keys(mapping).map(id => {
      return { id };
    });

    const newSegments = _.differenceBy(segments, mappedSegments, "id");
    const oldSegments = _.differenceBy(mappedSegments, segments, "id");
    debug("syncSegments", { check, mapping, newSegments, oldSegments });
    return Promise.map(
      newSegments,
      segment => {
        return this.createSegment(segment);
      },
      { concurrency: 1 }
    ).then(() => {
      return Promise.map(
        oldSegments,
        segment => {
          return this.deleteSegment(segment);
        },
        { concurrency: 1 }
      );
    });
  }
}

module.exports = SegmentsMappingUtil;
