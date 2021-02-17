/* @flow */

import type { ServiceObjectDefinition } from "./types";
import type {
  HullAccountUpdateMessage,
  HullContext,
  HullEntityName,
  HullTriggerSet,
  HullUserUpdateMessage
} from "hull";
import type { HullSegment } from "hull-client/src/types";
import type { PrivateSettings } from "hull-webhooks/types";
const _ = require("lodash");
const debug = require("debug")("hull-shared:utils");
const {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullIncomingUser,
  HullIncomingAccount,
  HullIncomingOpportunity
} = require("./hull-service-objects");

// Using this method of defining a property which is not enumerable to set the datatype on a data object
// I don't like that we have to use a special reserved word, but logging a warning if it ever exists and is not a ServiceObjectDefinition
const reservedHullDataTypeKey = "hull-connector-data-type";

async function asyncForEach(toIterateOn, asyncCallback) {

  if (
    isUndefinedOrNull(toIterateOn) ||
    isUndefinedOrNull(asyncCallback)) {
    return;
  }

  if (Array.isArray(toIterateOn)) {
    for (let i = 0; i < toIterateOn.length; i += 1) {
      await asyncCallback(toIterateOn[i], i);
    }
  } else {
    const keys = Object.keys(toIterateOn);
    for (let i = 0; i < keys.length; i += 1) {
      await asyncCallback(toIterateOn[keys[i]], keys[i]);
    }
  }

}

function getHullDataType(object: any) {
  if (isUndefinedOrNull(object)) {
    return;
  }

  return object[reservedHullDataTypeKey];
}

function setHullDataType(object: any, dataType: ServiceObjectDefinition) {
  if (isUndefinedOrNull(object)) {
    return;
  } else if (isUndefinedOrNull(dataType)) {
    // not sure if we should be doing this... maybe unset it if it has a value?
    return;
  }
  const existingValue = object[reservedHullDataTypeKey];
  if (existingValue && isUndefinedOrNull(_.get(existingValue, "name"))) {
    debug(`WARNING: object has existing ${reservedHullDataTypeKey} key: ${JSON.stringify(object)}`);
  }

  Object.defineProperty(object, reservedHullDataTypeKey, {
    enumerable: false,
    configurable: true,
    writable: false,
    value: dataType
  });
}

function sameHullDataType(dataType1: ServiceObjectDefinition, dataType2: ServiceObjectDefinition): boolean {
  const objectName1 = _.get(dataType1, "service_name");
  if (objectName1) {
    return objectName1 === _.get(dataType2, "service_name");
  }
  return false;
}


function getHullPlatformTypeName(classType: ServiceObjectDefinition) {
  if (isUndefinedOrNull(classType))
    return;

  if (
    sameHullDataType(classType, HullOutgoingUser)
    || sameHullDataType(classType, HullIncomingUser)
    || sameHullDataType(classType, HullOutgoingAccount)
    || sameHullDataType(classType, HullIncomingAccount)
    || sameHullDataType(classType, HullIncomingOpportunity)) {
    return classType.name;
  }

}

function isUndefinedOrNull(obj: any) {
  return obj === undefined || obj === null;
}

function parseIntOrDefault(intString: string, defaultInt: number) {
  if (!isUndefinedOrNull(intString) && typeof intString === 'string') {
    return parseInt(intString);
  }
  return defaultInt;
}

function getAttributeNamespace(hullName: string) {
  const parts = _.split(hullName, "/");
  if (parts.length > 1) {
    return _.first(parts);
  }
  return undefined;
}

function getAttributeName(hullName: string) {
  const parts = _.split(hullName, "/");
  if (parts.length > 1) {
    return _.last(parts);
  }
  return hullName;
}

function removeTraitsPrefix(attributeName: string) {
  if (!isUndefinedOrNull(attributeName) && attributeName.indexOf("traits_") === 0) {
    return removeTraitsPrefix(attributeName.substring("traits_".length));
  }
  return attributeName;
}

/**
 * This will serve as a basic secret replacement util when serializing objects, written initially for purplefusion tester
 * in the future, we'll want to either make this more configurable, or make the secret values easily identifiable
 * so that we don't have to hard code the paths to anonymize
 * @param object
 * @param pathsToAnonymize
 * @returns {string}
 */
function createAnonymizedObject(object, pathsToAnonymize = {
  "configuration.id": "5c092905c36af496c700012e",
  "configuration.secret": "shhh",
  "configuration.organization": "organization.hullapp.io",
  "configuration.hostname": "connectortest.connectordomain.io",
  "configuration.private_settings.access_token": "access_token",
  "configuration.private_settings.refresh_token": "refresh_token",
  "configuration.private_settings.api_key": "api_key",
}) {

  const toAnonymize = [];

  _.forEach(pathsToAnonymize, (value, key) => {
    const secretValue = _.get(object, key);
    if (!isUndefinedOrNull(secretValue) && typeof secretValue === "string") {
      toAnonymize.push({ value: secretValue, replacement: value });
    }
  })

  return JSON.stringify(object, (key, value) => {
    if (typeof value === "string") {
      if (!isUndefinedOrNull(value)) {
        let replacementValue = value;
        _.forEach(toAnonymize, secret => {
          replacementValue = _.replace(replacementValue, secret.value, secret.replacement);
        });
        return replacementValue;
      }
    }

    const dataType = getHullDataType(object);
    if (!isUndefinedOrNull(dataType)) {
      return {
        [reservedHullDataTypeKey]: dataType,
        object
      };
    }

    return value;
  }, 2);
}

function getFilters(
  entity: HullEntityName,
  private_settings: PrivateSettings
): HullTriggerSet {

  return {
    [`${entity}_segments_whitelist`]: private_settings[`synchronized_${entity}_segments`],
    [`${entity}_segments_blacklist`]: private_settings[`blocked_${entity}_segments`]
  };
}

function getTriggers(
  entity: HullEntityName,
  serviceName: string,
  private_settings: PrivateSettings,
  options?: Object
): HullTriggerSet {
  // TODO fill out user/lead/account triggers/filters

  const { sendOnAnySegmentChanges = false } = options || {};
  const {
    link_users_in_service = false,
    send_if_any_segment_change = false,
    send_all_user_attributes = false,
    send_all_account_attributes = false
  } = private_settings;

  const triggers = {};

  triggers[`${entity}_segments_entered`] = private_settings[`synchronized_${entity}_segments`];

  if (entity !== "account") {
    triggers[`${entity}_events`] = private_settings[`outgoing_${entity}_events`] || private_settings["outgoing_events"] || [];

    if (link_users_in_service) {
      triggers[`${entity}_account_linked`] = [true];
      triggers["account_attribute_updated"] = [`${serviceName}/id`];
    }

    if (send_all_user_attributes) {
      triggers[`${entity}_attribute_updated`] = ["all_attributes"];
      triggers[`${entity}_events`] = ["all_events"];
    }
  } else {
    if (send_all_account_attributes) {
      triggers[`${entity}_attribute_updated`] = ["all_attributes"];
    }
  }

  if (sendOnAnySegmentChanges || send_if_any_segment_change) {
    triggers[`${entity}_segments_updated`] = ["all_segments"];
  }

  return triggers;
}

/**
 * TODO break apart method so can unit test individual pieces...
 * @param  {[type]} context                 [description]
 * @param  {[type]} targetEntity            [description]
 * @param  {[type]} message                 [description]
 * @param  {[type]} options [description]
 * @return {[type]}                         [description]
 */
function toSendMessage(
  context: HullContext,
  targetEntity: HullEntityName,
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  options?: {
    serviceName?: string,
    // Useful if we're sending the segment as a default attribute and we want to keep it in sync with Hull
    sendOnAnySegmentChanges?: boolean
  }
): boolean {
  const privateSettings = _.get(context, "connector.private_settings");
  const { helpers } = context;
  const { hasMatchingTriggers } = helpers;

  const hullType = targetEntity === "account" ? "account" : "user";

  const filters = getFilters(targetEntity, privateSettings);
  const matchesFilters = hasMatchingTriggers({ mode: "all", message, matchOnBatch: true, triggers: filters });
  if (!matchesFilters) {
    context.client[`as${_.upperFirst(hullType)}`](message[hullType]).logger.debug(`outgoing.${hullType}.skip`, {
      reason: `${_.upperFirst(hullType)} is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the ${hullType} is present in the settings page, or add the ${hullType} to an existing synchronized segment`
    });
    return false;
  }

  // Entered segment
  // First: entered segment notification (no attribute change)
  // Second: segment_id change on user (is only attribute change)

  // Left segment? -> still need to confirm
  // First: left segment notification (no attribute change) -> do nothing
  // Second: segment_id removed from user (attribute change) -> do nothing

  // When we enter the segment, we should send no matter what even if no attribute changes
  // on enter, don't have to worry about lat
  // if we're trying to send everything on entering a segment,
  // then we need to circumvent the attribute change detection
  // and the inside synchronized segment logic too... because the segment id won't be in there...
  // do this first probably...

  // TODO for batch and "enteredSegment" should still look at attributes
  // to make sure we have any attributes that need synching
  // if not don't need to send, won't do anything anyway...
  // right? or should we just send the identifiers?
  // we'll keep it for now.
  if (context.isBatch) {
    const synchronizedUserSegments = _.get(
      context,
      "connector.private_settings.synchronized_user_segments"
    );
    const synchronizedLeadSegments = _.get(
      context,
      "connector.private_settings.synchronized_lead_segments"
    );
    const isUserLeadConnector = !_.isNil(synchronizedUserSegments) && !_.isNil(synchronizedLeadSegments);

    if (isUserLeadConnector) {
      const sendBatchAs = _.get(context, "connector.private_settings.send_batch_as");

      if (!sendBatchAs) {
        context.client.asUser(message.user).logger.info("outgoing.user.skip", { reason: "Please set batch type in your connector settings" });
        return false;
      }

      if ((targetEntity === "user" && sendBatchAs !== "Users") ||
        (targetEntity === "lead" && sendBatchAs !== "Leads")) {
        return false;
      }
    }
    return true;
  }

  if (!_.includes(["user", "lead", "account"], targetEntity)) {
    throw new Error(
      `Invalid input for target entity, option not supported: ${targetEntity}`
    );
  }

  const entity: any = _.get(message, hullType);

  const serviceName = _.get(options, "serviceName");
  if (!isUndefinedOrNull(serviceName)) {
    const isDeleted = _.get(message, `${hullType}.${serviceName}/deleted_at`, null);
    const isDeletedUser = _.get(message, `${hullType}.${serviceName}_${targetEntity}/deleted_at`, null);

    if (!isUndefinedOrNull(isDeleted) || !isUndefinedOrNull(isDeletedUser)) {

      const ignoreDeletedUsers = _.get(
        context,
        "connector.private_settings.ignore_deleted_users"
      );

      const ignoreDeletedAccounts = _.get(
        context,
        "connector.private_settings.ignore_deleted_accounts"
      );

      let skipDeleted = false;
      if ((isDeletedUser || isDeleted) && ignoreDeletedUsers && (targetEntity === 'user' || targetEntity === 'lead')) {
        skipDeleted = true;
      }

      if (isDeleted && ignoreDeletedAccounts && targetEntity === 'account') {
        skipDeleted = true;
      }

      if (skipDeleted) {
        context.client.asUser(entity).logger.debug(`outgoing.${hullType}.skip`, { reason: `${_.capitalize(hullType)} has been deleted` });
        return false;
      }
    }
  }

  // TODO expand use of triggers to include all user/lead/account triggers and filters
  const triggers = getTriggers(targetEntity, serviceName, privateSettings, options);
  const matchesTriggers = hasMatchingTriggers({ mode: "any", message, triggers });
  if (matchesTriggers) {
    return true;
  }

  if (hullType === "user") {
    const associated_account_id = _.get(context, "connector.private_settings.outgoing_user_associated_account_id");

    if (!isUndefinedOrNull(associated_account_id) && typeof associated_account_id === "string") {

      // if it's a user attribute check there
      const changedAccountId = _.get(message, `changes.user.${associated_account_id}`);
      if (!_.isEmpty(changedAccountId)) {
        return true;
      }

      // if it's an account attribute, it will be in the format account.*
      // so check if that's changed...
      const changedAccountIdOnAccount = _.get(message, `changes.${associated_account_id}`);
      if (!_.isEmpty(changedAccountIdOnAccount)) {
        return true;
      }
    }
  }

  // This is a special flag where we send all attributes regardless of change
  // may want to reorder this in cases where we still may not want to send if an event comes through
  const send_all_user_attributes = _.get(context, "connector.private_settings.send_all_user_attributes");
  if (send_all_user_attributes === true && hullType === "user") {

    const accountChanges = _.get(message.changes, "account");
    const userChanges = _.get(message.changes, "user");
    const userEvents = _.get(message, "events");

    // if there are only account changes, then do not send user update message
    if (!_.isEmpty(accountChanges) && _.isEmpty(userChanges) && _.isEmpty(userEvents)) {
      context.client.asUser(entity).logger.debug("outgoing.user.skip", {
        reason:
          "Has account changes but no user changes and no events"
      });
      return false;
    }
  }

  const outgoingAttributesPath =
    `connector.private_settings.outgoing_${targetEntity}_attributes`;
  const outgoingAttributes = _.get(context, outgoingAttributesPath);
  if (_.isEmpty(outgoingAttributes)) {
    if (hullType === "user") {
      debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
      context.client.asUser(entity).logger.debug("outgoing.user.skip", {
        reason:
          "There are no outgoing attributes to synchronize for users.  Please go to the settings page and add outgoing user attributes to synchronize"
      });
    } else if (hullType === "account") {
      debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
      context.client.asAccount(entity).logger.debug("outgoing.account.skip", {
        reason:
          "There are no outgoing attributes to synchronize for account.  Please go to the settings page and add outgoing account attributes to synchronize"
      });
    }
    return false;
  }

  // in cases where we do not have a id of the service, which means we haven't sync'd the entity before
  // send the user because we know it's in the list to send
  // this may be the result of pushing a full segment after it's creation
  // or could be because it's a new connector which we haven't done a full fetch
  if (!isUndefinedOrNull(serviceName)) {
    const serviceId = _.get(message, `${hullType}.${serviceName}/id`);
    const serviceIdUser = _.get(message, `${hullType}.${serviceName}_${targetEntity}/id`);
    if (_.isNil(serviceId) && _.isNil(serviceIdUser)) {
      return true;
    }
  }


  // TODO - move attribute-changed validations to triggers
  const attributesToSync = outgoingAttributes.map(attr => attr.hull);
  const entityAttributeChanges = _.get(message.changes, hullType, {});

  // if a user has mapped account attributes, have to filter like this
  if (hullType === "user") {
    const accountChanges = _.get(message, "changes.account", {});
    _.forEach(accountChanges, (value, key) => {
      entityAttributeChanges[`account.${key}`] = value;
    });
  }

  if (!_.isEmpty(entityAttributeChanges)) {
    const changedAttributes = _.reduce(
      entityAttributeChanges,
      (changeList, value, key) => {
        let attributeName = key;
        if (/\[\d+\]$/.test(attributeName)) {
          attributeName = attributeName.substr(0, attributeName.lastIndexOf("["));
        }
        changeList.push(attributeName);
        return changeList;
      },
      []
    );

    const hasAttributesToSync =
      _.intersection(attributesToSync, changedAttributes).length >= 1;

    if (!hasAttributesToSync) {
      if (hullType === "user") {
        debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
        context.client.asUser(entity).logger.debug("outgoing.user.skip", {
          reason:
            "No changes on any of the synchronized attributes for this user.  If you think this is a mistake, please check the settings page for the synchronized user attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"
        });
      } else if (hullType === "account") {
        debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
        context.client.asAccount(entity).logger.debug("outgoing.account.skip", {
          reason:
            "No changes on any of the synchronized attributes for this account.  If you think this is a mistake, please check the settings page for the synchronized account attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"
        });
      }
      return false;
    }
  } else {
    if (hullType === "user") {
      debug(
        `No attribute changes on target(${targetEntity}) entity: ${JSON.stringify(
          entity
        )}`
      );
      context.client.asUser(entity).logger.debug("outgoing.user.skip", {
        reason: "No changes on any of the attributes for this user."
      });
    } else if (hullType === "account") {
      debug(
        `No attribute changes on target(${targetEntity}) entity: ${JSON.stringify(
          entity
        )}`
      );
      context.client.asAccount(entity).logger.debug("outgoing.account.skip", {
        reason: "No changes on any of the attributes for this account."
      });
    }
    return false;
  }

  return true;
}

module.exports = {
  isUndefinedOrNull,
  parseIntOrDefault,
  toSendMessage,
  removeTraitsPrefix,
  getHullDataType,
  setHullDataType,
  createAnonymizedObject,
  getHullPlatformTypeName,
  sameHullDataType,
  asyncForEach,
  getAttributeName,
  getAttributeNamespace
};
