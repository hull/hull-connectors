const _ = require("lodash");
const Promise = require("bluebird");

class TagMapping {
  constructor(intercomAgent, ship, helpers, logger) {
    this.ship = ship;
    this.intercomClient = intercomAgent.intercomClient;
    this.helpers = helpers;
    this.logger = logger;
    this._tags = null;

    this.settingKey = "tag_mapping";
    this.mapping = _.get(this.ship, `private_settings[${this.settingKey}]`, {});
    this.originalMapping = _.cloneDeep(this.mapping);
  }

  getSegmentIds() {
    return _.keys(this.mapping);
  }

  getTagIds() {
    return _.values(this.mapping);
  }

  /**
   * @return Promise
   */
  persist() {
    if (_.isEqual(this.originalMapping, this.mapping)) {
      return Promise.resolve();
    }
    const newSettings = {};
    newSettings[this.settingKey] = this.mapping;
    return this.helpers.settingsUpdate(newSettings);
  }

  getTags() {
    if (!_.isNil(this._tags)) {
      return Promise.resolve(this._tags);
    }
    return this.intercomClient.get("/tags").then(({ body = {} }) => {
      this._tags = body.tags;
      return body.tags;
    });
  }

  /**
   * @param {Array} segments array of segments the tags should be sync to
   * @return Promise
   */
  sync(segments = [], forceTagsResync = false) {
    const mappedSegments = _.keys(this.mapping).map(id => {
      return { id };
    });
    const newSegments =
      forceTagsResync === true
        ? segments
        : _.differenceBy(segments, mappedSegments, "id");

    return Promise.map(
      newSegments,
      segment => {
        return this.createTag(segment);
      },
      { concurrency: 1 }
    ).then(() => this.persist());
  }

  /**
   * Creates new tag for selected segment
   *
   * @param {Object} segment { id, name }
   * @return Promise
   */
  createTag(segment) {
    const { id, name } = segment;
    return this.findTag(segment).then(foundTag => {
      if (!_.isUndefined(foundTag)) {
        this.mapping[id] = foundTag.id;
        return foundTag;
      }
      return this.intercomClient
        .post("/tags", { name })
        .then(({ body = {} }) => {
          this.mapping[id] = body.id;
          return body;
        });
    });
  }

  findTag(segment) {
    const { name } = segment;
    return this.getTags().then(tags => {
      const tag = _.find(tags, { name: _.trim(name) });
      if (_.isUndefined(tag)) {
        return undefined;
      }
      return tag;
    });
  }

  /**
   * Deletes tag mapped for provided segment.
   * Currently not used, we only add new segments, we never delete it
   *
   * @param {Object} segment { id, name }
   * @return {Promise}
   */
  deleteTag(segment) {
    const tagId = _.get(this.mapping, segment.id);

    if (!tagId) {
      return Promise.resolve();
    }

    return this.intercomClient
      .delete("/tags/{{tagId}}")
      .tmplVar({
        tagId
      })
      .then(() => {
        _.unset(this.mapping, segment.id);
        return Promise.resolve();
      })
      .catch(err => {
        if (err.statusCode === 404) {
          _.unset(this.mapping, segment.id);
          return Promise.resolve();
        }

        if (err.statusCode === 400) {
          this.logger.error("sync.error", {
            error: "Unable to delete tag",
            segment: segment.id,
            tag_id: tagId
          });
          _.unset(this.mapping, segment.id);
          return Promise.resolve();
        }

        return Promise.reject(err);
      });
  }
}

module.exports = TagMapping;
