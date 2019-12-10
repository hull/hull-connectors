const _ = require("lodash");

const validateChanges = (changes, inputData) => {
  // TODO: generate global whitelist from inputData
  return !_.isEmpty(_.intersection(inputData, _.keys(changes)));
};

const validateEvents = (events, inputData) => {
  // TODO: generate global whitelist from inputData

  const eventNames = _.map(events, "event");
  return !_.isEmpty(_.intersection(eventNames, inputData));
};

const validateSegments = (segments, inputData) => {
  // TODO: generate global whitelist from inputData

  const segmentIds = _.concat('all_segments', _.map(segments, 'id'));
  return !_.isEmpty(_.intersection(inputData, segmentIds));
};

const required = (obj, inputData) => {
  return !_.isEmpty(obj);
};



module.exports = {
  validateChanges,
  validateSegments,
  validateEvents,
  required
};
