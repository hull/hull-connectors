// @flow
import type { HullContext } from "../../types";

const _ = require("lodash");
const debug = require("debug")("hull-connector:metric-agent");

/**
 * Metric agent available as `req.hull.metric` object.
 * This class is being initiated by InstrumentationAgent.
 * If you want to change or override metrics behavior please @see Infra.InstrumentationAgent
 *
 * @public
 * @name metric
 * @memberof Context
 * @example
 * req.hull.metric.value("metricName", metricValue = 1);
 * req.hull.metric.increment("metricName", incrementValue = 1); // increments the metric value
 * req.hull.metric.event("eventName", { text = "", properties = {} });
 */
class MetricAgent {
  ctx: HullContext;

  manifest: Object;

  dogapi: Object;

  logFunction: Function;

  metrics: Object;

  mergeContext: Function;

  captureException: Function;

  _captureException: Function;

  constructor(ctx: HullContext | Object, instrumentationAgent: Object) {
    this.mergeContext = instrumentationAgent.mergeContext.bind(
      instrumentationAgent
    );
    this._captureException = instrumentationAgent.captureException.bind(
      instrumentationAgent
    );
    this.metrics = instrumentationAgent.metrics;
    this.dogapi = instrumentationAgent.dogapi;
    this.flattenTags = !!this.dogapi;
    this.manifest = instrumentationAgent.manifest;
    this.ctx = ctx;
    this.logFunction = process.env.CONNECTOR_METRIC_LOGS
      ? _.get(ctx, "client.logger.debug", debug)
      : () => {};
  }

  /**
   * Sets metric value for gauge metric
   * @public
   * @memberof Context.metric
   * @param  {string} metric metric name
   * @param  {number} value metric value
   * @param  {Array}  [additionalTags=[]] additional tags in form of `["tag_name:tag_value"]`
   * @return {mixed}
   */
  value(metric: string, value: number = 1, additionalTags: Array<string> = []) {
    const tags = this.getTags(additionalTags);
    this.logFunction("metric.value", { metric, value, tags });
    if (!this.metrics) {
      return null;
    }
    try {
      return this.metrics.gauge(metric, parseFloat(value), tags);
    } catch (err) {
      console.warn("metricVal.error", err);
    }
    return null;
  }

  /**
   * Increments value of selected metric
   * @public
   * @memberof Context.metric
   * @param  {string} metric metric metric name
   * @param  {number} value value which we should increment metric by
   * @param  {Array}  [additionalTags=[]] additional tags in form of `["tag_name:tag_value"]`
   * @return {mixed}
   */
  increment(
    metric: string,
    value: number = 1,
    additionalTags: Array<string> = []
  ) {
    const tags = this.getTags(additionalTags);
    this.logFunction("metric.increment", { metric, value, tags });
    if (!this.metrics) {
      return null;
    }
    try {
      return this.metrics.increment(metric, parseFloat(value), tags);
    } catch (err) {
      console.warn("metricInc.error", err);
    }
    return null;
  }

  /**
   * @public
   * @memberof Context.metric
   * @param  {string} title
   * @param  {string} [text]
   * @param  {Object} [properties={}]
   * @return {mixed}
   */
  event(title: string, text: string = "", properties: Object = {}) {
    // TODO: deprecate calls to event as it's not supported by statsd
    this.logFunction("metric.event", { title, text, properties });
    if (!this.dogapi) {
      return null;
    }
    return this.dogapi.event.create(
      `${this.manifest.name}.${title}`,
      text,
      _.merge({}, properties, {
        tags: this.getMetricTagsArray()
      })
    );
  }

  captureException(err: Error, extra: Object = {}, tags: Object = {}) {
    return this._captureException(
      err,
      extra,
      _.merge({}, this.getMetricTagsObject(), tags)
    );
  }

  getTags(additionalTags: Array<string> = []) {
    return this.flattenTags
      ? this.getMetricTagsArray(additionalTags)
      : this.getMetricTagsObject(additionalTags);
  }

  getMetricTagsObject(additionalTags: Array<string> = []) {
    const { organization = "none", id = "none" } =
      this.ctx.client !== undefined ? this.ctx.client.configuration() : {};
    const moreTags = _.reduce(
      additionalTags,
      (ts, t) => {
        const [k, v] = t.split(":");
        return { ...ts, [k]: v };
      },
      {}
    );
    const hullHost = organization.split(".").slice(1).join(".");
    const tags = {
      source: "ship",
      ship_version: this.manifest.version,
      connector_version: this.manifest.version,
      ship_name: this.manifest.name,
      connector_name: this.manifest.name,
      ship_env: process.env.NODE_ENV || "production",
      connector_env: process.env.NODE_ENV || "production",
      hull_env: process.env.HULL_ENV || "production",
      hull_host: hullHost,
      organization,
      ship: id,
      connector: id,
      handler_name: this.ctx.handlerName || "none"
    };
    return { ...tags, ...moreTags };
  }

  getMetricTagsArray(additionalTags: Array<string> = []) {
    const tagsObject = this.getMetricTagsObject(additionalTags);
    return _.toPairs(tagsObject).map(([key, value]) => `${key}:${value}`);
  }
}

module.exports = MetricAgent;
