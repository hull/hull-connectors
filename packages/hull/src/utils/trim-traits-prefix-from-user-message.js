// @flow
import type {
  HullUser,
  HullUserChanges,
  HullUserUpdateMessage
} from "../types";

const _ = require("lodash");

const replace = (value, key) => key.replace(/^traits_/, "");

function trimTraitsPrefixFromUserMessage(userMessage: {
  user: HullUser,
  changes: HullUserChanges
}): HullUserUpdateMessage {
  const res = {
    ...userMessage
  };
  res.user = _.mapKeys(userMessage.user, replace);
  if (userMessage.changes && userMessage.changes.user) {
    res.changes = {
      ...userMessage.changes,
      user: _.mapKeys(userMessage.changes.user, replace)
    };
  }
  return res;
}

module.exports = trimTraitsPrefixFromUserMessage;
