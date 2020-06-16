/* @flow */
import type { THullUserUpdateMessage } from "hull/lib";

const SalesforceClient = require("../../../service-client");
const { sortSfObjects } = require("../../../utils/sort-utils");
const { transformEvent } = require("../../../utils/transform-utils");
const Promise = require("bluebird");
const _ = require("lodash");

function buildEventEnvelopes(sfObjectType: string, options: Object = {}, msg: THullUserUpdateMessage): Array<Object> {
  const objectEnvelopes = [];
  const message_events = _.get(msg, "events", []);
  _.forEach(message_events, (hullEvent) => {
    const events_mapping = _.get(options, "events_mapping");

    function getEventMapping() {
      return _.find(events_mapping, (event_mapping) => {
        return event_mapping.event === hullEvent.event;
      });
    }

    const eventMapping = getEventMapping();
    if (!_.isNil(eventMapping)) {
      if (sfObjectType === "Task") {
        _.set(options, "task_type", _.get(eventMapping, "task_type", null));
      }
      const transformedEvent = transformEvent(sfObjectType, options, msg, hullEvent);
      if (!_.isNil(transformedEvent)) {
        const objectEnvelope = {
          hullEvent,
          transformedEvent
        };
        objectEnvelopes.push(objectEnvelope);
      } else {
        // TODO log unable to transform hull event to sf object
      }
    }
  });

  return objectEnvelopes;
}

async function findTasks(sfObjectType: string, sf: SalesforceClient, options = {}, event_ids = []): Promise<any[]> {
  const sfExternalIdentifier = _.get(options, "salesforce_external_id", null);

  if (!_.isNil(sfExternalIdentifier)) {
    return sf.queryExistingRecords(
      sfObjectType,
      sfExternalIdentifier,
      event_ids
    );
  }
  return Promise.resolve([]);
}

// TODO fix to accept any type of salesforce activity
async function sendEvents(hullClient: Object, sf: SalesforceClient, options: Object = {}, messages: Array<THullUserUpdateMessage>): Promise<*> {
  const resourceType = _.get(options, "sf_resource_type", "Task");

  if (_.isNil(resourceType)) {
    return Promise.resolve();
  }

  await Promise.map(messages, async (msg: THullUserUpdateMessage) => {
    const objectEnvelopes = buildEventEnvelopes(resourceType, options, msg);

    if (_.isEmpty(objectEnvelopes)) {
      return Promise.resolve();
    }

    const event_ids = _.map(objectEnvelopes, "hullEvent.event_id");

    const existingSfTasks = await findTasks(resourceType, sf, options, event_ids);

    const { toUpdate, toInsert } = sortSfObjects(options, objectEnvelopes, existingSfTasks);

    const tasksInserted = await sf.insert(toInsert, { resource: resourceType });
    const tasksUpdated = await sf.update(toUpdate, { resource: resourceType });

    const records = _.concat(tasksInserted || [], tasksUpdated || []);
    const errors = _.filter(records, (r) => {
      return r.success === false;
    });
    if (errors.length > 0) {
      await hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
        .logger.error("outgoing.event.error", { records });
    } else {
      await hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
        .logger.info("outgoing.event.success", { records });
    }
    return Promise.resolve();
  }, { concurrency: 10 });

  return Promise.resolve();
}

module.exports = {
  sendEvents
};
