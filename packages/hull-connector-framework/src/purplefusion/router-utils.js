/* @flow */
import type { ServiceObjectDefinition } from "./types";

const _ = require("lodash");

const {
  TransientError
} = require("hull/src/errors");

const {
  HullOutgoingAccount,
  HullOutgoingUser,
  WebPayload
} = require("./hull-service-objects");

const { isUndefinedOrNull } = require("./utils");

// -1 is (status1 < status2)
// 0 is (status1 === status2)
// 1 is (status1 > status1)
function compareStatus(status1: string, status2: string) {
  const statusHierarchy: Array<string> = ["ok", "warning", "error", "setupRequired"];

  if (status1 === status2) return 0;

  if (statusHierarchy.indexOf(status1) < statusHierarchy.indexOf(status2)) {
    return -1;
  }

  return 1;
}

function statusCallback(ctx, messages) {

  let flattenedMessages;
  if (Array.isArray(messages)) {
    // if it comes out as an array, try to flatten so it's one level of array
    // messages may have been nested depending on the logic
    flattenedMessages = _.flatten(messages);
  } else if (isUndefinedOrNull(messages)) {
    // if messages are undefined or null
    // messages should be empty array
    flattenedMessages = [];
  } else {
    // otherwise, make the flattened messages an array
    flattenedMessages = [messages];
  }

  let worstStatus = "ok";
  let messagesToSend = [];
  _.forEach(flattenedMessages, message => {
    if (!message.status || !message.message)
      return;

    const statusComparison = compareStatus(worstStatus, message.status);
    if (statusComparison === 0) {
      messagesToSend.push(message.message);
    } else if (statusComparison < 0) {
      messagesToSend = [message.message];
      worstStatus = message.status;
    }
  });

  const statusResults = { status: worstStatus, messages: messagesToSend };
  return ctx.client.put(`${ctx.connector.id}/status`, statusResults)
    .then(() => {
      return Promise.resolve(statusResults);
    });
}

function statusErrorCallback(ctx, err) {
  // TODO not sure what to do here, but this is getting ugly...
  // don't send it back to the status endpoint for now
  // may want to add some fancier logic which looks at how long it's been since the previous status update
  // and then maybe fires the error
  if (err instanceof TransientError) {
    return Promise.resolve({ status: "warning", messages: [err.message] });
  }
  const statusResults = { status: "error", messages: [err.message] };
  return ctx.client.put(`${ctx.connector.id}/status`, statusResults)
    .then(() => {
      return Promise.resolve(statusResults);
    });
}

function resolveServiceDefinition(endpoint: { handler: string, channel?: string }): ServiceObjectDefinition {
  const channel = endpoint.channel;
  if (!isUndefinedOrNull(channel)) {
    if (channel === "account:update") {
      return HullOutgoingAccount;
    } else if (channel === "user:update") {
      return HullOutgoingUser;
    }
  }

  return WebPayload;
}

module.exports = {
  statusCallback,
  statusErrorCallback,
  resolveServiceDefinition
};
