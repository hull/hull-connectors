// @flow
import type { HullEntityName, HullEntityClaims } from "hull-client";
import type { HullContext } from "../types";

const _ = require("lodash");

type IncomingClaimsResult = {
  claims?: HullEntityClaims,
  error?: string
};

const jp = require("jsonpath");
// const debug = require("debug")("hull:incoming-claims-helper");

function isInvalid(value: mixed): boolean {
  return (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && value.trim() === "") ||
    (typeof value === "number" && value === 0)
  );
}

function getSettingValue(ctx, settingName) {
  if (
    ctx.connector &&
    ctx.connector.private_settings &&
    ctx.connector.private_settings[settingName] &&
    Array.isArray(ctx.connector.private_settings[settingName])
  ) {
    return ctx.connector.private_settings[settingName];
  }
  return undefined;
}

/**
 * This function builds incoming claims for users and accounts.
 * It takes `incoming_user_claims` or `incoming_account_claims` setting
 * from connector `private_settings`.
 * The struture of the setting is following:
 * ```
 * [{
 *  hull: "nameOfTheHullClaims",
 *  service: "nameOfThe3rdPartyField",
 *  required: true
 * }]
 * ```
 * The builder reduce this array using the 3rd object passed in.
 * In 3 cases it won't return claims but error:
 * 1. when a required claim is missing or is missing a value
 * 2. when there is not even a single claim even though all are optional
 * 3. when there is not correct settings in the connector object
 */
const incomingClaims = (ctx: HullContext) => (
  entity: HullEntityName,
  objectToTransform: Object,
  options?: { anonymous_id_prefix?: string, anonymous_id_service: string }
): IncomingClaimsResult => {
  try {
    const settingName = `incoming_${entity}_claims`;
    const setting = getSettingValue(ctx, settingName);
    if (!setting) {
      throw new Error(
        `The incoming claims configuration for ${entity} is missing.`
      );
    }

    const readyClaims = setting.reduce((claims, entry) => {
      if (!entry.hull || !entry.service) {
        return claims;
      }
      // if we already have a value for selected claim we skip
      if (claims[entry.hull]) {
        return claims;
      }

      // we need to jsonpath to support nested properties
      const valueFromObject: mixed = jp.value(objectToTransform, entry.service);
      if (isInvalid(valueFromObject)) {
        if (entry.required === true) {
          throw new Error(
            `Value of field "${entry.service}" is empty, cannot map it to ${entry.hull}, but it's required.`
          );
        }
        return claims;
      }
      claims[entry.hull] = valueFromObject;
      return claims;
    }, {});

    // we got some correct claims, now we handle anonymoud_id
    if (options && options.anonymous_id_service) {
      const valueForAnonymousId: mixed = jp.value(
        objectToTransform,
        options.anonymous_id_service
      );
      if (
        isInvalid(valueForAnonymousId) === false &&
        (typeof valueForAnonymousId === "string" ||
          typeof valueForAnonymousId === "number")
      ) {
        const anonymousIdValue = options.anonymous_id_prefix
          ? `${options.anonymous_id_prefix}:${valueForAnonymousId.toString()}`
          : valueForAnonymousId;
        readyClaims.anonymous_id = anonymousIdValue;
      }
    }

    if (Object.keys(readyClaims).length === 0) {
      const allServiceKeys = setting
        .map(s => s.service)
        .filter(service => service)
        .join(", ");
      throw new Error(
        `All configured fields for claims are empty: anonymous_id${
          _.isEmpty(allServiceKeys) ? "" : ", "
        }${allServiceKeys}`
      );
    }

    return {
      claims: readyClaims
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
};

module.exports = incomingClaims;
