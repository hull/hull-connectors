// @flow

import type {
  HullContext,
  HullTriggerSet,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";

import { isValidMessage } from "hull-connector-framework/src/purplefusion/triggers/validations";

import TRIGGER_DEFINITIONS from "hull-connector-framework/src/purplefusion/triggers/triggers";

import _ from "lodash";

const hasMatchingTriggers = (ctx: HullContext) => ({
  mode = "any",
  matchOnBatch,
  message,
  triggers
}: {
  mode: "any",
  matchOnBatch?: boolean,
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  triggers: { [string]: HullTriggerSet }
}): boolean =>
  (ctx.isBatch && matchOnBatch) ||
  (mode === "all" ? _.every : _.some)(
    triggers,
    (whitelist: HullTriggerSet, path: string) =>
      isValidMessage(
        message,
        _.get(TRIGGER_DEFINITIONS, `${path}.validations`, []),
        whitelist
      )
  );

module.exports = hasMatchingTriggers;
