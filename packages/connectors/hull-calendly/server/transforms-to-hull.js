/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

import {
  varUndefinedOrNull,
  not
} from "hull-connector-framework/src/purplefusion/conditionals";
import { v4 as uuidv4 } from "uuid";
import {
  HullIncomingEvent,
  HullUserIdentity,
  HullIncomingUser
} from "hull-connector-framework/src/purplefusion/hull-service-objects";

import {
  CalendlyWebhookEventRead
} from "./service-objects";

const _ = require("lodash");

function eventTransformation() {
  return [
    { writeTo: { path: "events[0].eventName", value: "${eventName}" } },
    { writeTo: { path: "events[0].context.source", value: "${eventSource}" } },
    { writeTo: { path: "events[0].properties.event_type", value: "${webhookTopic}" } },
    {
      operateOn: { component: "input", select: "payload.updated_at" },
      writeTo: {
        path: "events[0].context.created_at",
        value: "${operateOn}"
      }
    },
    {
      writeTo: {
        path: "events[0].context.event_id",
        formatter: () => {
          return uuidv4();
        }
      }
    },
    {
      operateOn: "${propertiesMapping}",
      expand: { keyName: "hullAttribute", valueName: "selectPath" },
      then: {
        operateOn: { component: "input", select: "${selectPath}", name: "serviceValue" },
        condition: not(varUndefinedOrNull("serviceValue")),
        writeTo: {
          path: "events[0].properties.${hullAttribute}",
          value: "${operateOn}"
        }
      }
    },
    {
      operateOn: "${contextMapping}",
      expand: { keyName: "hullAttribute", valueName: "selectPath" },
      then: {
        operateOn: { component: "input", select: "${selectPath}", name: "serviceValue" },
        condition: not(varUndefinedOrNull("serviceValue")),
        writeTo: {
          path: "events[0].context.${hullAttribute}",
          value: "${operateOn}"
        }
      }
    }
  ];
}

function contactIdentityTransformation({ entityType }) {
  return [
    {
      operateOn: `\${connector.private_settings.${entityType}_claims}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: "${pathToEntity}.${mapping.service}", name: "serviceValue" },
        condition: not(varUndefinedOrNull("serviceValue")),
        writeTo: {
          path: "ident.${mapping.hull}"
        }
      }
    }
  ]
}

const transformsToService: ServiceTransforms = [
  {
    input: CalendlyWebhookEventRead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then:  _.concat(
      eventTransformation(),
      contactIdentityTransformation({ entityType: "user" }),
      [
        {
          operateOn: { component: "input", select: "${pathToEntity}.name" },
          condition: not(varUndefinedOrNull("operateOn")),
          writeTo: { path: "attributes.name", format: { operation: "setIfNull", value: "${operateOn}" } }
        }
      ]
    )
  }
];

module.exports = transformsToService;
