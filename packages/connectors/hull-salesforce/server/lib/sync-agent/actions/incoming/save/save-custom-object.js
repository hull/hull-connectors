/* @flow */

const _ = require("lodash");
const Promise = require("bluebird");

function isValidSalesforceObject(record: Object): boolean {
  const type = _.get(record, "attributes.type", "");

  let isValid = true;
  switch (type) {
    case "Task":
      if (_.get(record, "WhoId", null) === null) {
        isValid = false;
      } else if (_.get(record, "Subject", null) === null) {
        isValid = false;
      }
      break;
    case "Opportunity":
      break;
    default:
      isValid = true;
  }
  return isValid;
}

function saveCustomObject({ privateSettings, syncAgent, record }: Object): Promise<*> {
  const hullClient = syncAgent.hullClient;
  const attributesMapper = syncAgent.attributesMapper;
  const mappings = syncAgent.mappings;

  // TODO look into other object types. This is very customized for tasks
  const promises = [];

  const serviceType = _.get(record, "attributes.type", null);
  const createdDate = _.get(record, "CreatedDate");

  // Who.Type returns Contact, Lead, Account, etc.
  const associatedType = _.get(record, "Who.Type", null);

  if (serviceType === null) {
    hullClient.logger.error("Salesforce object type not found");
    return Promise.resolve();
  } else if (associatedType === null) {
    hullClient.logger.error(`Salesforce object [${JSON.stringify(record)}] not associated with a user or account entity`);
    return Promise.resolve();
  }

  if (!isValidSalesforceObject(record)) {
    hullClient.logger.error(`Unable to save record ${_.get(record, "Id")}`);
    return Promise.resolve();
  }

  const anonymousId = `salesforce-${associatedType.toLowerCase()}:${_.get(record, "WhoId")}`;

  const asUser = hullClient.asUser({ anonymous_id: anonymousId });

  const context = {};

  const external_id_field = _.get(privateSettings, "salesforce_external_id", null);
  if (!_.isNil(external_id_field) && !_.isNil(_.get(record, external_id_field, null))) {
    hullClient.logger.info("incoming.event.skip", { reason: "Task created from external system", record });
    return Promise.resolve();
  }
  const event_id = `salesforce-${_.toLower(serviceType)}:${_.get(record, "Id")}`;
  _.set(context, "source", "salesforce");
  _.set(context, "created_at", createdDate);

  _.set(context, "event_id", event_id);

  const taskType = _.get(record, "Type", null);
  let eventName = !_.isNil(taskType) ? `Salesforce Task:${taskType}` : "Salesforce Task";

  if (_.get(record, "IsDeleted", false)) {
    eventName = `DELETED - ${eventName}`;
  }

  const event = attributesMapper.mapToHullEvent(_.get(mappings, "Task"), serviceType, record);

  if (serviceType === "Task") {
    promises.push(
      asUser.track(eventName, event, context)
        .then(() => {
          // TODO what should the log message be?
          asUser.logger.info("incoming.event.success", { event });
        })
        .catch((error) => {
          // TODO what should the log message be?
          asUser.logger.error("incoming.event.error", { error });
        })
    );
  }
  return Promise.all(promises);
}

module.exports = {
  saveCustomObject
};
