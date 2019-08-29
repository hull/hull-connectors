/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  HullIncomingUser,
  HullUserRaw,
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { HubspotIncomingEmailEvent } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HubspotIncomingEmailEvent,
    output: HullIncomingUser,
    strategy: "Jsonata",
    arrayStrategy: "send_raw_array",
    direction: "incoming",
    transforms: [
      "{" +
      "   \"ident\": {" +
      "     \"email\": `recipient`" +
      "    }," +
      "    \"events\": [" +
      "    $merge([ " +
      "        $.{\"eventName\": $lookup($eventsMapping, $string(type))}," +
      "            {" +
      "              \"properties\":" +
      "                 $.{" +
      "                   \"email_campaign_id\": emailCampaignId," +
      "                   \"email_subject\": $string(type & \" - \" & $emailContent.subject)," +
      "                   \"link_url\": url," +
      "                   \"portal_id\": portalId," +
      "                   \"email_id\": id," +
      "                   \"sent_by\": sentBy.id," +
      "                   \"recipient\": recipient," +
      "                   \"last_imported_at\": $last_sync," +
      "                   \"created_at\": $event_created_at," +
      "                   \"email_body\": \"[html-body]\n\" & $emailContent.body" +
      "                 }, " +
      "              \"context\":" +
      "                 $.{" +
      "                   \"event_id\": $string(\"hubspot:\" & portalId & \":\" & id)," +
      "                   \"created_at\": $event_created_at," +
      "                   \"type\": \"email\"," +
      "                   \"source\": \"hubspot\"" +
      "                 }" +
      "            }" +
      "        ])" +
      "    ]" +
      "}"
    ]
  }
];

module.exports = transformsToService;
