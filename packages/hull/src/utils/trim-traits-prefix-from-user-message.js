// @flow
import type { HullUserUpdateMessage } from "hull-client";

const _ = require("lodash");

function replace(value, key) {
  return key.replace(/^traits_/, "");
}

function trimTraitsPrefixFromUserMessage(
  userMessage: HullUserUpdateMessage
): HullUserUpdateMessage {
  const clonedUserMessage = _.cloneDeep(userMessage);
  clonedUserMessage.user = _.mapKeys(clonedUserMessage.user, replace);

  if (clonedUserMessage.changes && clonedUserMessage.changes.user) {
    clonedUserMessage.changes.user = _.mapKeys(
      clonedUserMessage.changes.user,
      replace
    );
  }
  return clonedUserMessage;
}

module.exports = trimTraitsPrefixFromUserMessage;
