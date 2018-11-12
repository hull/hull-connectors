const _ = require("lodash");
const Promise = require("bluebird");
const debug = require("debug")("hull-mailchimp:interests-mapping-util");

/**
 * Agent managing Mailchimp interests aka groups
 * and mapping stored in ships private settings
 * TODO: integrate with SyncAgent
 */
class InterestsMappingUtil {
  constructor(mailchimpClient, ship, helpers) {
    this.mailchimpClient = mailchimpClient;
    this.helpers = helpers;
    this.ship = ship;
    this.interestsCategoryId = _.get(
      ship,
      "private_settings.interest_category_id"
    );
    this.listId = _.get(ship, "private_settings.mailchimp_list_id");
    this.mapping = _.get(this.ship, "private_settings.interests_mapping", {});
    this.originalMapping = _.cloneDeep(this.mapping);
    this._interests = null;
  }

  /** 4
   * Updates internal segments mapping
   * @param {Object} mapping
   */
  updateMapping() {
    if (
      _.isEqual(this.originalMapping, this.mapping) &&
      _.isEqual(
        this.ship.private_settings.interest_category_id,
        this.interestsCategoryId
      )
    ) {
      return Promise.resolve();
    }
    return this.helpers.settingsUpdate({
      interests_mapping: this.mapping,
      interest_category_id: this.interestsCategoryId
    });
  }

  getInterestsForSegments(segmentIds) {
    return _.reduce(
      this.mapping,
      (ret, interestId, segmentId) => {
        return _.merge({}, ret, {
          [interestId]: _.includes(segmentIds, segmentId)
        });
      },
      {}
    );
  }

  /**
   * Returns ids of segments saved in mapping
   */
  getSegmentIds() {
    return _.keys(this.mapping);
  }

  findHullCategory() {
    const title = "Hull Segments";
    return this.mailchimpClient
      .get("/lists/{{listId}}/interest-categories")
      .query({ count: 100 })
      .then(({ body = {} }) => {
        const { categories = [] } = body;
        return _.find(categories, { title });
      });
  }

  createHullCategory() {
    const title = "Hull Segments";
    return this.mailchimpClient
      .post("/lists/{{listId}}/interest-categories")
      .send({ title, type: "hidden" })
      .then(({ body }) => body);
  }

  ensureCategory({ check = false } = {}) {
    const { interestsCategoryId } = this;
    debug("ensureCategory", { interestsCategoryId, check });
    if (interestsCategoryId && check === false) {
      return Promise.resolve({ id: interestsCategoryId });
    }
    return this.findHullCategory()
      .then(category => {
        debug("found category?", typeof category, category && category.id);
        return category || this.createHullCategory();
      })
      .then(category => {
        if (category && category.id) {
          this.interestsCategoryId = category.id;
          return category;
        }
        throw new Error("Cannot createHullCategory ?");
      });
  }

  getMailchimpInterests() {
    if (this._interests !== null) {
      return Promise.resolve(this._interests);
    }
    return this.ensureCategory().then(({ id }) => {
      return this.mailchimpClient
        .get(
          "/lists/{{listId}}/interest-categories/{{interestCatId}}/interests"
        )
        .tmplVar({ interestCatId: id })
        .query({ count: 500 })
        .then(({ body }) => {
          this._interests = body;
          return body;
        });
    });
  }

  recreateSegment(segment) {
    const steps = [
      "ensureCategory",
      "deleteInterest",
      "createInterest",
      "updateMapping"
    ];
    return Promise.mapSeries(steps, step => this[step](segment));
  }

  findInterest(segment = {}) {
    const { name } = segment;
    return this.getMailchimpInterests().then((body = {}) => {
      const { interests = [] } = body;
      return _.find(
        interests,
        interest =>
          _.trim(name.toLowerCase()) === _.trim(interest.name.toLowerCase())
      );
    });
  }

  createInterest(segment) {
    const { name } = segment;
    const { interestsCategoryId } = this;
    return this.findInterest(segment).then(existingInterest => {
      if (existingInterest) {
        this.mapping[segment.id] = existingInterest.id;
        return Promise.resolve();
      }
      return this.mailchimpClient
        .post(
          "/lists/{{listId}}/interest-categories/{{interestsCategoryId}}/interests"
        )
        .tmplVar({ interestsCategoryId })
        .send({ name })
        .then(({ body = {} }) => {
          this.mapping[segment.id] = body.id;
          return body;
        });
    });
  }

  /**
   * Removes interest from Mailchimp and segment from mapping
   * @param {Object} segment
   * @return {Promise}
   */
  deleteInterest(segment) {
    const interestId = _.get(this.mapping, segment.id);
    const { interestsCategoryId } = this;
    if (!interestId) {
      return Promise.resolve();
    }

    return this.mailchimpClient
      .delete(
        "/lists/{{listId}}/interest-categories/{{interestsCategoryId}}/interests/{{interestId}}"
      )
      .tmplVar({ interestsCategoryId, interestId })
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
   * @return {Promise}
   */
  syncInterests(segments = [], { check = false } = {}) {
    const mapping = check === true ? {} : this.mapping;
    const mappedSegments = _.keys(mapping).map(id => {
      return { id };
    });
    const newSegments = _.differenceBy(segments, mappedSegments, "id");
    const oldSegments = _.differenceBy(mappedSegments, segments, "id");
    debug("syncInterests", { mapping, newSegments, oldSegments });
    return Promise.map(
      newSegments,
      segment => {
        return this.createInterest(segment);
      },
      { concurrency: 1 }
    ).then(() => {
      return Promise.map(
        oldSegments,
        segment => {
          return this.deleteInterest(segment);
        },
        { concurrency: 1 }
      );
    });
  }
}

module.exports = InterestsMappingUtil;
