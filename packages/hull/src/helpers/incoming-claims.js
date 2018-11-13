// @flow
import type { HullEntityType, HullEntityClaims } from "hull-client";
import type { HullContext } from "../types";

type incomingClaimsResult = {
  claims?: HullEntityClaims,
  error?: string
};

function isInvalid(value: mixed): boolean {
  return (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && value.trim() === "") ||
    (typeof value === "number" && value === 0)
  );
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
function incomingClaims(
  ctx: HullContext,
  entityType: HullEntityType,
  objectToTransform: Object
): incomingClaimsResult {
  try {
    const settingName = `incoming_${entityType}_claims`;
    if (
      !ctx.connector ||
      !ctx.connector.private_settings ||
      !ctx.connector.private_settings[settingName] ||
      !Array.isArray(ctx.connector.private_settings[settingName])
    ) {
      throw new Error(
        `The incoming claims configuration for ${entityType} is missing.`
      );
    }
    const setting = ctx.connector.private_settings[settingName];

    const readyClaims = setting.reduce((claims, entry) => {
      if (!entry.hull || !entry.service) {
        return claims;
      }
      if (isInvalid(objectToTransform[entry.service])) {
        if (entry.required === true) {
          throw new Error(
            `Value of field "${entry.service}" is empty, cannot map it to ${
              entry.hull
            }, but it's required.`
          );
        }
        return claims;
      }
      claims[entry.hull] = objectToTransform[entry.service];
      return claims;
    }, {});
    if (Object.keys(readyClaims).length === 0) {
      const allServiceKeys = setting
        .map(s => s.service)
        .filter(service => service)
        .join(", ");
      throw new Error(
        `All configured fields for claims are empty: ${allServiceKeys}`
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
}

module.exports = incomingClaims;
