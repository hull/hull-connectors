// @flow

const _ = require("lodash");

const filterNone = (entity, whitelist) => {
  return entity;
};

const filterSegments = (segments: Object, whitelist: Array<string>) => {
  return _.filter(segments, (segment) => {
    if (_.includes(whitelist, "all_segments")) {
      return true;
    }
    return _.includes(whitelist, segment.id);
  });
};

const filterAttributeChanges = (attributeChanges: Object, whitelist: Array<string>) => {
  return _.pick(attributeChanges, whitelist);
};

const filterEvents = (createdEvents: Object, whitelist: Array<string>) => {
  return _.filter(createdEvents, (event) => {
    return _.includes(whitelist, event.event);
  })
};

const filterNew = (isNew: boolean, whitelist: boolean) => {
  return isNew === whitelist;
};

const filterEntity = (entity: Object, rules: Array<Object>, whitelist: Array<string>): Array<string> => {
  let filteredSubEntity = _.cloneDeep(entity);
  _.forEach(rules, rule => {

    if (_.isFunction(rule)) {
      filteredSubEntity = rule(filteredSubEntity, whitelist);
    }

    if (!_.isFunction(rule) && _.isObject(rule)) {
      filteredSubEntity = _.filter([filteredSubEntity], rule);
    }

    if (_.isBoolean(rule) || _.isString(rule)) {
      if (whitelist === rule) {
        filteredSubEntity = entity;
      }
    }
  });
  return filteredSubEntity;
};

const filterMessage = (message: Object, filters: Object, whitelist: Array<string>) => {
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
