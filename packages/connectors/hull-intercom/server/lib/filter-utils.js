const _ = require("lodash");

function filterSegmentFromChanges(
  changes,
  changedObjectKey,
  segment,
  changeName
) {
  const changeAttributeName = `${changedObjectKey}.${changeName}`;
  const existingChanges = _.get(changes, changeAttributeName);

  if (existingChanges) {
    const newSegments = _.reject(existingChanges, {
      id: segment.id
    });
    if (newSegments.length === 0) {
      _.unset(changes, changeAttributeName);
    } else {
      _.set(changes, changeAttributeName, newSegments);
    }
  }
}

function filterEnteredAndLeftChanges(changes, changedObjectKey, segments) {
  if (segments) {
    _.forEach(segments, segment => {
      filterSegmentFromChanges(changes, changedObjectKey, segment, "entered");
      filterSegmentFromChanges(changes, changedObjectKey, segment, "left");
    });
  }
}

function addSegmentChanges(
  changes,
  changedObjectKey,
  changedObject,
  changeName
) {
  const changePath = `${changedObjectKey}.${changeName}`;
  const segmentChanges = _.get(changedObject, changeName);
  if (segmentChanges) {
    _.set(
      changes,
      changePath,
      _.get(changes, changePath, []).concat(segmentChanges)
    );
  }
}
/**
 * Deduplicates messages by user.id and joins all events into a single message.
 *
 * @param {Array<THullUserUpdateMessage>} messages The list of messages to deduplicate.
 * @returns {Array<THullUserUpdateMessage>} A list of unique messages.
 * @memberof FilterUtil
 */
function deduplicateUserUpdateMessages(messages) {
  return _.chain(messages)
    .groupBy("user.id")
    .map(groupedMessages => {
      // return early if nothing to do
      if (groupedMessages.length === 1) {
        return groupedMessages[0];
      }

      const sortedMessages = _.sortBy(groupedMessages, ["user.indexed_at"]);
      const latestMessage = _.cloneDeep(_.last(sortedMessages));
      const hashedEvents = {};
      const changes = {};

      sortedMessages.forEach(m => {
        _.get(m, "events", []).forEach(e => {
          _.set(hashedEvents, e.event_id, e);
        });

        _.forEach(
          _.get(m, "changes", {}),
          (changedObject, changedObjectKey) => {
            if (
              changedObjectKey === "segments" ||
              changedObjectKey === "account_segments"
            ) {
              filterEnteredAndLeftChanges(
                changes,
                changedObjectKey,
                changedObject.left
              );
              filterEnteredAndLeftChanges(
                changes,
                changedObjectKey,
                changedObject.entered
              );

              addSegmentChanges(
                changes,
                changedObjectKey,
                changedObject,
                "entered"
              );
              addSegmentChanges(
                changes,
                changedObjectKey,
                changedObject,
                "left"
              );
            } else if (changedObjectKey === "is_new") {
              if (changedObject) {
                changes.is_new = true;
              }
            } else if (
              changedObjectKey === "user" ||
              changedObjectKey === "account"
            ) {
              _.forEach(changedObject, (value, key) => {
                // creating the object if it doesn't exist don't want to null out
                let existingChangedObject = changes[changedObjectKey];
                if (!existingChangedObject) {
                  existingChangedObject = {};
                  changes[changedObjectKey] = existingChangedObject;
                }

                const existingChange = existingChangedObject[key];

                if (existingChange) {
                  existingChange[1] = value[1];
                } else {
                  existingChangedObject[key] = _.cloneDeep(value);
                }
              });
            } else {
              console.log(`Unknown change object: ${changedObjectKey}`);
            }
          }
        );
      });
      latestMessage.events = _.values(hashedEvents);
      latestMessage.changes = changes;

      return latestMessage;
    })
    .value();
}

module.exports = { deduplicateUserUpdateMessages };
