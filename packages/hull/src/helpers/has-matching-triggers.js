// @flow

import type {
  HullContext,
  HullTriggerWhitelist,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";

import { isValidMessage } from "hull-connector-framework/src/purplefusion/triggers/validations";

import TRIGGER_DEFINITIONS from "hull-connector-framework/src/purplefusion/triggers/triggers";

import _ from "lodash";

const hasMatchingTriggers = (_ctx: HullContext) => ({
  message,
  triggers
}: {
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  triggers: { [string]: HullTriggerWhitelist }
}): boolean =>
  _.some(triggers, (whitelist: HullTriggerWhitelist, path: string) =>
    isValidMessage(
      message,
      _.get(TRIGGER_DEFINITIONS, `${path}.validations`, []),
      whitelist
    )
  );

module.exports = hasMatchingTriggers;
