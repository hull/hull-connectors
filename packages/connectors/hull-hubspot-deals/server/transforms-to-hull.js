/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { HubspotIncomingDeal } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HubspotIncomingDeal,
    output: ServiceUserRaw,
    strategy: "Jsonata",
    arrayStrategy: "send_raw_array",
    direction: "incoming",
    transforms: [
      "$merge([\n" +
      "  $merge($each(properties, function($v, $k) {{ $k: $v.value }})),\n" +
      "  { \n" +
      "    \"hull-service-accountId\": associations.associatedCompanyIds[0],\n" +
      "    \"id\": dealId\n" +
      "  }\n" +
      "])"
    ]
  }
];

module.exports = transformsToService;
