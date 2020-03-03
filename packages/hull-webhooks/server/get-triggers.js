// @flow
import _ from "lodash";

const buildTriggers = ({
  entityType,
  synchronized_segments,
  inputData,
  serviceAction
}) => {
  const triggers = [];
  if (!_.isEmpty(synchronized_segments)) {
    _.map(inputData, (whitelist, action) => {
      if (whitelist === true || !_.isEmpty(whitelist)) {
        triggers.push({
          serviceAction: {
            url: serviceAction
          },
          inputData: {
            [`${entityType}_segments`]: synchronized_segments,
            [action]: whitelist
          }
        });
      }
    });
  }

  return triggers;
};

const getTriggers = entityType => (private_settings: Object): Array<{}> => {
  let triggers = [];

  const { url } = private_settings;

  const synchronized_segments = private_settings.synchronized_segments;

  if (!_.isEmpty(synchronized_segments)) {
    const inputData = {
      [`entered_${entityType}_segments`]: private_settings.synchronized_segments_enter,
      [`left_${entityType}_segments`]: private_settings.synchronized_segments_leave,
      [`${entityType}_attribute_updated`]: private_settings.synchronized_attributes,
      [`${entityType}_events`]: private_settings.synchronized_events
    };

    if (
      _.includes(private_settings.synchronized_events, "User Created") ||
      _.includes(private_settings.synchronized_events, "Account Created")
    ) {
      inputData[`is_new_${entityType}`] = true;
    }

    triggers = _.concat(
      triggers,
      buildTriggers({
        entityType,
        synchronized_segments,
        inputData,
        serviceAction: url
      })
    );
  }

  return triggers;
};

export default getTriggers;
