// @flow

import type {
  HullContext,
  HullUserUpdateMessage
  // HullAccountUpdateMessage
} from "hull";

const {
  hasValidTrigger
} = require("hull-connector-framework/src/purplefusion/triggers/trigger-utils");

const groupEntities = ({ group, message }) => ({
  variables: {},
  ...message,
  user: group(message.user),
  account: group(message.account)
});

const getPayloads = (
  ctx: HullContext,
  message: HullUserUpdateMessage,
  triggers: Array<Object>
): Array<{}> => {
  const { client, isBatch } = ctx;
  const { group } = client.utils.traits;

  const payloads = [];
  if (isBatch || hasValidTrigger(message, triggers)) {
    payloads.push(
      groupEntities({
        group,
        message: {
          ...message
        }
      })
    );
  }

  return payloads;
};
export default getPayloads;
