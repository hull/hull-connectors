/* @flow */

import type { ServiceObjectDefinition } from "./types";
import type { HullAccountUpdateMessage, HullContext, HullEntityName, HullUserUpdateMessage } from "hull";
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
    isUndefinedOrNull(asyncCallback) ||
    !Array.isArray(toIterateOn)) {
    return;
  }

  for (let i = 0; i < toIterateOn.length; i += 1) {
    await asyncCallback(toIterateOn[i], i);
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
    return true;
  }

  let segmentAttribute;
  let synchronizedSegmentPath;
  let outgoingAttributesPath;
  if (targetEntity === "user") {
    segmentAttribute = "segments";
    (synchronizedSegmentPath =
      "connector.private_settings.synchronized_user_segments"),
      (outgoingAttributesPath =
        "connector.private_settings.outgoing_user_attributes");
  } else if (targetEntity === "account") {
    segmentAttribute = "account_segments";
    (synchronizedSegmentPath =
      "connector.private_settings.synchronized_account_segments"),
      (outgoingAttributesPath =
        "connector.private_settings.outgoing_account_attributes");
  } else {
    throw new Error(
      `Invalid input for target entity, option not supported: ${targetEntity}`
    );
  }

  const entity: any = _.get(message, targetEntity);

  const serviceName = _.get(options, "serviceName");
  if (!isUndefinedOrNull(serviceName)) {
    const isDeleted = _.get(message, `${targetEntity}.${serviceName}/deleted_at`, null);

    if (!isUndefinedOrNull(isDeleted)) {
      const ignoreDeletedUsers = _.get(
        context,
        "connector.private_settings.ignore_deleted_users"
      );

      const ignoreDeletedAccounts = _.get(
        context,
        "connector.private_settings.ignore_deleted_accounts"
      );

      if (targetEntity === 'user' && ignoreDeletedUsers === true) {
        context.client.asUser(entity).logger.debug("outgoing.user.skip", { reason: "User has been deleted" });
        return false;
      }

      if (targetEntity === 'account' && ignoreDeletedAccounts === true) {
        context.client.asUser(entity).logger.debug("outgoing.account.skip", { reason: "Account has been deleted" });
        return false;
      }
    }
  }

  // // We probably should introduce a standard event filter
  // if (targetEntity === "user") {
  //   const synchronizedUserEvents = _.get(context, "connector.private_settings.synchronized_user_events");
  //   const userEvents = _.get(message, "events");
  //   if (Array.isArray(userEvents) && !_.isEmpty(userEvents)) {
  //     const eventsToSend = _.filter(userEvents, (userEvent) => {
  //       return
  //     })
  //     return true;
  //   }
  // }

  const enteredSegments = _.get(message, `changes.${segmentAttribute}.entered`);
  const enteredAnySegments = !_.isEmpty(enteredSegments);

  if (enteredAnySegments) {
    const enteredSegmentIds = enteredSegments.map(segment => segment.id);
    const enteredSynchronizedSegment =
      _.intersection(enteredSegmentIds, _.get(context, synchronizedSegmentPath))
        .length >= 1;

    if (enteredSynchronizedSegment) {
      return true;
    }
  }

  const entityInSegments = _.get(message, segmentAttribute, []);
  const entityInSegmentIds = entityInSegments.map( segment => segment.id );

  // All is the default segment that everyone is in, so if it's selected, it should mean this thing should go
  entityInSegmentIds.push("ALL");

  const matchesSegments = _.intersection(
    entityInSegmentIds,
    _.get(context, synchronizedSegmentPath)
  ).length >= 1;

  // I think we can maybe take out the is_export logic because we're trying to only use isBatch
  if (!matchesSegments && !context.notification.is_export) {
    if (targetEntity === "user") {
      debug(`User does not match segment ${ JSON.stringify(entity) }`);
      context.client.asUser(entity).logger.debug("outgoing.user.skip", { reason: "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment" });
    } else if (targetEntity === "account") {
      debug(`Account does not match segment ${ JSON.stringify(entity) }`);
      context.client.asAccount(entity).logger.debug("outgoing.account.skip", { reason: "Account is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the account is present in the settings page, or add the account to an existing synchronized segment" });
    }
    return false;
  }

  // Should we do on entered segment too?
  if (targetEntity === "user") {
    const linkInService = _.get(
      context,
      "connector.private_settings.link_users_in_service"
    );

    if (
      !isUndefinedOrNull(linkInService) &&
      typeof linkInService === "boolean" &&
      linkInService
    ) {
      const changedAccounts = _.get(message, "changes.account.id");

      if (!_.isEmpty(changedAccounts)) {
        // user changed accounts, and link_users_in_service is enabled
        // so update user...
        return true;
      }

      const serviceName = _.get(options, "serviceName");
      if (!isUndefinedOrNull(serviceName)) {
        // try to detect if the account id of the user is changing
        // If 2 users have been resolved to the same user, could result in loops
        // but as long as they don't keep changing it's ok we think... they'll eventually converge to 1
        // although there's a million factors there...
        const changedServiceAccounts = _.get(message, `changes.account.${serviceName}/id`);
        if (changedServiceAccounts) {
          return true;
        }
      }
      // if account enters a synchronized segment
      // but it was or wasn't in a synchronized segment before
      // may want to perform account linking
    }

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

  // Do not have to normalize this field with regard to array index at the end [1]...
  // because this field does not do the diff like the other fields, it gives a { left: [{}...], entered:} syntax
  if (_.get(options, "sendOnAnySegmentChanges", false) === true
      || _.get(context, "connector.private_settings.send_if_any_segment_change", false) === true) {
    const segmentChanges = _.get(message.changes, segmentAttribute);
    if (!_.isEmpty(segmentChanges)) {
      return true;
    }
  }

  // This is a special flag where we send all attributes regardless of change
  // may want to reorder this in cases where we still may not want to send if an event comes through
  const send_all_user_attributes = _.get(context, "connector.private_settings.send_all_user_attributes");
  if (send_all_user_attributes === true && targetEntity === "user") {

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

    return true;
  }

  const send_all_account_attributes = _.get(context, "connector.private_settings.send_all_account_attributes");
  if (send_all_account_attributes === true && targetEntity === "account") {
    return true;
  }

  // Is this the right thing?
  // don't have to do anything on segment exited right?
  // just filter on attribute change...
  // const exitedSegments = _.get(message, "changes.segments.exited");
  // const exitedAnySegments = !_.isEmpty(enteredSegments);

  const outgoingAttributes = _.get(context, outgoingAttributesPath);
  if (_.isEmpty(outgoingAttributes)) {
    if (targetEntity === "user") {
      debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
      context.client.asUser(entity).logger.debug("outgoing.user.skip", {
        reason:
          "There are no outgoing attributes to synchronize for users.  Please go to the settings page and add outgoing user attributes to synchronize"
      });
    } else if (targetEntity === "account") {
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
    const serviceId = _.get(message, `${targetEntity}.${serviceName}/id`);
    if (isUndefinedOrNull(serviceId)) {
      return true;
    }
  }

  const attributesToSync = outgoingAttributes.map(attr => attr.hull);
  const entityAttributeChanges = _.get(message.changes, targetEntity, {});

  // if a user has mapped account attributes, have to filter like this
  if (targetEntity === "user") {
    const accountChanges = _.get(message, "changes.account", {});
    _.forEach(accountChanges, (value, key) => {
      entityAttributeChanges[`account.${key}`] = value;
    });
  }

  if (!_.isEmpty(entityAttributeChanges)) {
    const changedAttributes = _.reduce(
      entityAttributeChanges,
      (changeList, value, key) => {
        changeList.push(key);
        return changeList;
      },
      []
    );

    const hasAttributesToSync =
      _.intersection(attributesToSync, changedAttributes).length >= 1;

    if (!hasAttributesToSync) {
      if (targetEntity === "user") {
        debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
        context.client.asUser(entity).logger.debug("outgoing.user.skip", {
          reason:
            "No changes on any of the synchronized attributes for this user.  If you think this is a mistake, please check the settings page for the synchronized user attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"
        });
      } else if (targetEntity === "account") {
        debug(`No mapped attributes to synchronize ${JSON.stringify(entity)}`);
        context.client.asAccount(entity).logger.debug("outgoing.account.skip", {
          reason:
            "No changes on any of the synchronized attributes for this account.  If you think this is a mistake, please check the settings page for the synchronized account attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"
        });
      }
      return false;
    }
  } else {
    if (targetEntity === "user") {
      debug(
        `No attribute changes on target(${targetEntity}) entity: ${JSON.stringify(
          entity
        )}`
      );
      context.client.asUser(entity).logger.debug("outgoing.user.skip", {
        reason: "No changes on any of the attributes for this user."
      });
    } else if (targetEntity === "account") {
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
