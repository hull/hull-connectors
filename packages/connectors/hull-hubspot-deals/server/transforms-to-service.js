/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
const { toUnixTimestamp } = require("hull-connector-framework/src/purplefusion/transform-utils");

const {
  HullUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { HubspotOutgoingDeal } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullUserRaw,
    output: HubspotOutgoingDeal,
    strategy: "Jsonata",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
    transforms: [
      "$merge([\n" +
      "  { \"properties\": [$each(function($v, $k) { $not($k in [\"id\", \"hull_service_accountId\"]) ? {\"name\": $k,\"value\": $v}})]},\n" +
      "  { \"associations\": {" +
      "\"associatedCompanyIds\": hull_service_accountId ? [hull_service_accountId] }\n" +
      "}])"
    ],
    preAttributeTransform: [
      {
        attributes: [
          "closedate",
          "notes_last_updated",
          "hubspot_owner_assigneddate"
        ],
        transform: toUnixTimestamp()
      }
    ]
  }
];

module.exports = transformsToService;
