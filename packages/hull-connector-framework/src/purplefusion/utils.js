/* @flow */

import type { ServiceObjectDefinition } from "./types";

const _ = require("lodash");
const debug = require("debug")("hull-shared:utils");
const {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullIncomingUser,
  HullIncomingAccount
} = require("./hull-service-objects");

// Using this method of defining a property which is not enumerable to set the datatype on a data object
// I don't like that we have to use a special reserved word, but logging a warning if it ever exists and is not a ServiceObjectDefinition
const reservedHullDataTypeKey = "hull-connector-data-type";

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

function getHullPlatformTypeName(classType: ServiceObjectDefinition) {
  if (isUndefinedOrNull(classType))
    return;

  if (
    classType.name === HullOutgoingUser.name
    || classType.name === HullIncomingUser.name
    || classType.name === HullOutgoingAccount.name
    || classType.name === HullIncomingAccount.name) {
    return classType.service_name;
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
 * @param  {[type]} synchronizedSegmentPath [description]
 * @param  {[type]} outgoingAttributesPath  [description]
 * @return {[type]}                         [description]
 */
function toSendMessage(context: HullContext, targetEntity: "user" | "account",
    message: HullUserUpdateMessage | HullAccountUpdateMessage): boolean {

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
      synchronizedSegmentPath = "connector.private_settings.synchronized_user_segments",
      outgoingAttributesPath = "connector.private_settings.outgoing_user_attributes"
    } else if (targetEntity === "account") {
      segmentAttribute = "account_segments"
      synchronizedSegmentPath = "connector.private_settings.synchronized_account_segments",
      outgoingAttributesPath = "connector.private_settings.outgoing_account_attributes"
    } else {
      throw new Error(`Invalid input for target entity, option not supported: ${targetEntity}`);
    }

    const enteredSegments = _.get(message, `changes.${segmentAttribute}.entered`);
    const enteredAnySegments = !_.isEmpty(enteredSegments);


    if (enteredAnySegments) {
      const enteredSegmentIds = enteredSegments.map( segment => segment.id );
      const enteredSynchronizedSegment = _.intersection(
        enteredSegmentIds,
        _.get(context, synchronizedSegmentPath)
      ).length >= 1;

      if (enteredSynchronizedSegment) {
        return true;
      }
    }

    const entity: any = _.get(message, targetEntity);

    const entityInSegments = _.get(message, segmentAttribute, []);
    const entityInSegmentIds = entityInSegments.map( segment => segment.id );

    // All is the default segment that everyone is in, so if it's selected, it should mean this thing should go
    entityInSegmentIds.push("ALL");

    const matchesSegments = _.intersection(
      entityInSegmentIds,
      _.get(context, synchronizedSegmentPath)
    ).length >= 1;

    if (!matchesSegments) {
      if (targetEntity === "user") {
        debug(`User does not match segment ${ JSON.stringify(entity) }`);
        context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment" });
      } else if (targetEntity === "account") {
        debug(`Account does not match segment ${ JSON.stringify(entity) }`);
        context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "Account is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the account is present in the settings page, or add the account to an existing synchronzed segment" });
      }
      return false;
    }

    // Should we do on entered segment too?
    if (targetEntity === "user") {

      const linkInService = _.get(context, "connector.private_settings.link_users_in_service");

      if (!isUndefinedOrNull(linkInService) && typeof linkInService === "boolean" && linkInService) {
        const changedAccounts = _.get(message, `changes.account.id`);

        if (!_.isEmpty(changedAccounts)) {
          // user changed accounts, and link_users_in_service is enabled
          // so update user...
          return true;
        }
        // if account enteres a synchronized segment
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

    //Is this the right thing?
    // don't have to do anything on segment exited right?
    // just filter on attribute change...
    // const exitedSegments = _.get(message, "changes.segments.exited");
    // const exitedAnySegments = !_.isEmpty(enteredSegments);

    const send_all_user_attributes = _.get(context, "connector.private_settings.send_all_user_attributes");
    if (send_all_user_attributes === true && targetEntity === "user")
      return true;

  const send_all_account_attributes = _.get(context, "connector.private_settings.send_all_account_attributes");
  if (send_all_account_attributes === true && targetEntity === "account")
    return true;

    const outgoingAttributes = _.get(context, outgoingAttributesPath);
    if (_.isEmpty(outgoingAttributes)) {
      if (targetEntity === "user") {
        debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
        context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "There are no outgoing attributes to synchronize for users.  Please go to the settings page and add outgoing user attributes to synchronize" });
      } else if (targetEntity === "account") {
        debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
        context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "There are no outgoing attributes to synchronize for account.  Please go to the settings page and add outgoing account attributes to synchronize" });
      }
      return false;
    }

    const attributesToSync = outgoingAttributes.map( attr => attr.hull );

    const entityAttributeChanges = _.get(message.changes, targetEntity);

    if (!_.isEmpty(entityAttributeChanges)) {
      const changedAttributes = _.reduce(entityAttributeChanges, (changeList, value, key) => {
        changeList.push(key);
        return changeList;
      }, []);

      const hasAttributesToSync = _.intersection(
        attributesToSync,
        changedAttributes
      ).length >= 1;

      if (!hasAttributesToSync) {
        if (targetEntity === "user") {
          debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
          context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "No changes on any of the synchronized attributes for this user.  If you think this is a mistake, please check the settings page for the synchronized user attributes to ensure that the attribute which changed is in the synchronized outgoing attributes" });
        } else if (targetEntity === "account") {
          debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
          context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "No changes on any of the synchronized attributes for this account.  If you think this is a mistake, please check the settings page for the synchronized account attributes to ensure that the attribute which changed is in the synchronized outgoing attributes" });
        }
        return false;
      }
    } else {
      if (targetEntity === "user") {
        debug(`No attribute changes on target(${targetEntity}) entity: ${ JSON.stringify(entity) }`);
        context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "No changes on any of the attributes for this user." });
      } else if (targetEntity === "account") {
        debug(`No attribute changes on target(${targetEntity}) entity: ${ JSON.stringify(entity) }`);
        context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "No changes on any of the attributes for this account." });
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
  getHullPlatformTypeName
}
