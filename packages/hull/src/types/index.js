// @flow

/* eslint-disable no-use-before-define */
/* :: export type * from "hull-client"; */
/* :: export type * from "./incoming"; */
/* :: export type * from "./connector"; */
/* :: export type * from "./context"; */
/* :: export type * from "./manifest"; */
/* :: export type * from "./oauth"; */
/* :: export type * from "./responses"; */
/* :: export type * from "./handlers"; */
/* :: export type * from "./router"; */
/* :: export type * from "./notifications"; */
/* :: export type * from "./sync-agent"; */
/* :: export type * from "./settings"; */
/* :: export type * from "./schema"; */
/* :: export type * from "./get-entity"; */
/* :: export type * from "./triggers"; */

import type Cache from "../infra/cache/cache-agent";
import type Queue from "../infra/queue/queue-agent";
import type Worker from "../connector/worker";
import type Instrumentation from "../infra/instrumentation/instrumentation-agent";

export type * from "hull-client";
const Client = require("hull-client");

export type HullInstrumentation = Instrumentation;
export type HullCache = Cache;
export type HullQueue = Queue;
export type HullWorker = Worker;
export type HullClient = Client;

// IMPORTANT: FOR SPREAD SYNTAX:
// https://github.com/facebook/flow/issues/3534#issuecomment-287580240
// You need to use {...$Exact<Type>} if you want to avoid
// making every field in Type optional

export type HTTPMethod =
  | "all"
  | "delete"
  | "get"
  | "patch"
  | "post"
  | "put"
  | "ALL"
  | "DELETE"
  | "GET"
  | "PATCH"
  | "POST"
  | "PUT";

export type HullConnectorSettings = {
  [HullConnectorSettingName: string]: any
};

export type HullJsonataType =
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "stringifiedArray";

export type HullAttributeMapping = {
  hull: string,
  service: string,
  castAs?: HullJsonataType,
  overwrite: boolean
};
