/* @flow */
import type { Transform, ServiceTransforms } from "./shared/types";

const { HullOutgoingUser, HullOutgoingAccount } = require("./shared/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: OutreachProspectWrite,
    strategy: "PropertyKeyedValue",
    template: {
      hard:[
        { type: "prospect" }
      ],
      directmap: [
        { input: "outreach/id", output: "id" },
        {
          input: "account.outreach/id",
          output: {
            relationships: {
              account: {
                data: {
                  type: "account",
                  id: "${account.outreach/id}"
                }
              }
            }
          }
        },
      ],
      keyedGroups: [{
        output: "attributes",
        mapping: "settings.prospect_attributes_outbound",
        arrayStrategy: "appendindex"
      }]
    }
  },
  {
    input: HullOutgoingAccount,
    output: OutreachAccountWrite,
    strategy: "PropertyKeyedValue",
    template: {
      hard:[
        { type: "account" }
      ],
      directmap: [
        { input: "outreach/id", output: "id" },
      ],
      keyedGroups: [{
        output: "attributes",
        mapping: "settings.prospect_attributes_outbound",
        arrayStrategy: "appendindex"
      }]
    }
  }
];

module.exports = {
  transformsToService
};
