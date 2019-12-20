// @flow

const _ = require("lodash");
const { triggers } = require("./triggers");

const filter = (entity: Object, triggerInputData: Object): Array<string>  => {
  const standardFilter = _.concat(
    !_.isEmpty(_.get(entity, "user", {})) ? [ "user", "segments" ] : [],
    [ "account", "account_segments", "message_id"]
  );
  const filteredEntity = _.pick(entity, standardFilter);

  _.forEach(_.keys(triggerInputData), action => {
    const whitelist = _.get(triggerInputData, action);

    if (_.isNil(action) || _.isEmpty(action)) {
      return {};
    }

    const actionDefinition = _.get(triggers, action, {});

    const { filter } = actionDefinition;

    _.forEach(filter, (validation) => {
      const subEntity = _.get(entity, validation);

      if (_.includes(validation, "changes.segments") || _.includes(validation, "changes.account_segments")) {
        _.set(filteredEntity, validation, _.filter(subEntity, (segment) => {
          if (_.includes(whitelist, "all_segments")) {
            return true;
          }
          return _.includes(whitelist, segment.id);
        }));
      }
      if (validation === "changes.user" || validation === "changes.account") {
        _.set(filteredEntity, validation, _.pick(subEntity, whitelist));
      }
      if (validation === "changes.is_new") {
        _.set(filteredEntity, validation, subEntity);
      }
      if (validation === "events") {
        _.set(filteredEntity, validation, _.filter(subEntity, (event) => {
          return _.includes(whitelist, event.event);
        }));
      }
    });
  });

  return filteredEntity;
};



module.exports = {
  filter
};
