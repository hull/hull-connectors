/* @flow */
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullUserUpdateMessage
} from "hull";

const _ = require("lodash");
const debug = require("debug")("hull-shared:utils");

class ServiceData {
  classType: any;
  context: Object;
  data: any

  constructor(classType: any, data: any) {
    this.classType = classType;
    this.context = {};
    this.data = data;
  }
}


function isUndefinedOrNull(obj: any) {
  return obj === undefined || obj === null;
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
    message: HullUserUpdateMessage | HullAccountUpdateMessage,
    synchronizedSegmentPath: string, outgoingAttributesPath: string): boolean {

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

    const enteredSegments = _.get(message, "changes.segments.entered");
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

    // const matchesSegments = _.intersection(
    //   _.get(entity, "segment_ids"),
    //   _.get(context, synchronizedSegmentPath)
    // ).length >= 1;
    //
    // if (!matchesSegments) {
    //   if (targetEntity === "user") {
    //     debug(`User does not match segment ${ JSON.stringify(entity) }`);
    //     context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronzed segment" });
    //   } else if (targetEntity === "account") {
    //     debug(`Account does not match segment ${ JSON.stringify(entity) }`);
    //     context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "Account is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the account is present in the settings page, or add the account to an existing synchronzed segment" });
    //   }
    //   return false;
    // }
    //
    // //Is this the right thing?
    // // don't have to do anything on segment exited right?
    // // just filter on attribute change...
    // // const exitedSegments = _.get(message, "changes.segments.exited");
    // // const exitedAnySegments = !_.isEmpty(enteredSegments);
    //
    // const outgoingAttributes = _.get(context, outgoingAttributesPath);
    // if (_.isEmpty(outgoingAttributes)) {
    //   if (targetEntity === "user") {
    //     debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
    //     context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "There are no outgoing attributes to synchronize for users.  Please go to the settings page and add outgoing user attributes to synchronize" });
    //   } else if (targetEntity === "account") {
    //     debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
    //     context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "There are no outgoing attributes to synchronize for account.  Please go to the settings page and add outgoing account attributes to synchronize" });
    //   }
    //   return false;
    // }
    //
    // const attributesToSync = outgoingAttributes.map( attr => attr.hull );
    // const changedAttributes = _.reduce(message.changes, (changeList, value, key) => {
    //   changeList.push(key);
    //   return changeList;
    // }, []);
    //
    // const hasAttributesToSync = _.intersection(
    //   attributesToSync,
    //   changedAttributes
    // ).length >= 1;
    //
    // if (!hasAttributesToSync) {
    //   if (targetEntity === "user") {
    //     debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
    //     context.client.asUser(entity).logger.info("outgoing.user.skip", { reason: "No changes on any of the synchronized attributes for this user.  If you think this is a mistake, please check the settings page for the synchronized user attributes to ensure that the attribute which changed is in the synchronized outgoing attributes" });
    //   } else if (targetEntity === "account") {
    //     debug(`No mapped attributes to synchronize ${ JSON.stringify(entity) }`);
    //     context.client.asAccount(entity).logger.info("outgoing.account.skip", { reason: "No changes on any of the synchronized attributes for this user.  If you think this is a mistake, please check the settings page for the synchronized account attributes to ensure that the attribute which changed is in the synchronized outgoing attributes" });
    //   }
    //   return false;
    // }

    return true;
  }

module.exports = {
  isUndefinedOrNull,
  toSendMessage,
  ServiceData
}
