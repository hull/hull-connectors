// @flow

import type { HullSegment, HullEvent } from "hull";
const _ = require("lodash");

const filterNone = (entity: any, whitelist: Array<string>) => entity;

const filterSegments = (
  segments: Array<HullSegment> = [],
  whitelist: Array<string>
) =>
  segments.filter(
    segment =>
      whitelist.includes("all_segments") ||
      whitelist.includes("ALL") ||
      whitelist.includes(segment.id)
  );

const filterAttributeChanges = (
  attributeChanges: Object = {},
  whitelist: Array<string>
) => _.pick(attributeChanges, whitelist);

const filterEvents = (
  events: Array<HullEvent> = [],
  whitelist: Array<string>
) =>
  events.filter(
    event =>
      whitelist.includes("all_events") ||
      whitelist.includes("ALL") ||
      whitelist.includes(event.event)
  );

const filterNew = (isNew: boolean, whitelist: boolean) => isNew === whitelist;

const filterEntity = (
  entity: Object,
  rules: Array<Object>,
  whitelist: Array<string>
): Array<string> => {
  let filteredSubEntity = _.cloneDeep(entity);
  _.forEach(rules, rule => {
    if (_.isFunction(rule)) {
      filteredSubEntity = rule(filteredSubEntity, whitelist);
    }

    if (!_.isFunction(rule) && _.isObject(rule)) {
      filteredSubEntity = _.filter([filteredSubEntity], rule);
    }
  });
  return filteredSubEntity;
};

const filterMessage = (
  message: Object,
  filters: Object,
  whitelist: Array<string>
) => {
  const filteredMessage = {};
  _.forEach(_.keys(filters), filter => {
    const entity = _.get(message, filter);
    const rawRules = _.get(filters, filter);

    const rules = !_.isArray(rawRules) ? [rawRules] : rawRules;

    let subEntity;
    if (!_.isNil((subEntity = filterEntity(entity, rules, whitelist)))) {
      _.set(filteredMessage, filter, subEntity);
    }
  });
  return filteredMessage;
};

module.exports = {
  filterMessage,
  filterSegments,
  filterAttributeChanges,
  filterEvents,
  filterNew,
  filterNone
};
