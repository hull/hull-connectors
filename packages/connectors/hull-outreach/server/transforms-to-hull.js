/* @flow */
import type { ServiceTransforms } from "./shared/types";

const {
  HullIncomingUser,
  HullIncomingAccount
} = require("./shared/hull-service-objects");

const {
  OutreachProspectRead,
  OutreachAccountRead
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms =
  [
    {
      input: OutreachProspectRead,
      output: HullIncomingUser,
      strategy: "PropertyKeyedValue",
      template: {
        directmap: [
          { input: "id", output: "ident.anonymous_id" },
          { input: "attributes.${user_specified_id}", output: "ident.external_id" },
          { input: "attributes.domain", output: "ident.domain" }
        ],
        keyedGroups: [{
          input: "attributes",
          output: "attributes",
          mapping: "settings.prospect_attributes_inbound",
          arrayStrategy: "appendindex",
          key: "outreach/${inKey}",
          value: {
            value: "${value}",
            operation: "set"
          }
        }]
      }
    },
    {
      input: OutreachAccountRead,
      output: HullIncomingAccount,
      strategy: "PropertyKeyedValue",
      template: {
        directmap: [
          { input: "id", output: "ident.anonymous_id" },
          { input: "attributes.${user_specified_id}", output: "ident.external_id" },
          { input: "attributes.domain", output: "ident.domain" }
        ],
        keyedGroups: [{
          input: "attributes",
          output: "attributes",
          mapping: "settings.account_attributes_inbound",
          arrayStrategy: "appendindex",
          key: "outreach/${inKey}",
          value: {
            value: "${value}",
            operation: "set"
          }
        }]
      }
    }
  ];

module.exports = {
  transformsToHull
};
