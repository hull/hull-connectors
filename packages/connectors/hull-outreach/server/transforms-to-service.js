/* @flow */
import type { Transform, ServiceTransforms } from "./shared/types";

const { HullServiceUser, HullServiceAccount } = require("./shared/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullServiceUser,
    output: OutreachProspectWrite,
    strategy: "PropertyKeyedValue",
    template: {
      hard:[
        { type: "prospect" }
      ],
      directmap: [
        { input: "outreach/id", output: "id" }
      ],
      keyedGroups: [{
        output: "attributes",
        mapping: "settings.prospect_attributes_outbound",
        arrayStrategy: "appendindex"
      }]
    }
  },
  {
    input: HullServiceAccount,
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
