/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const TaskWrite: ServiceObjectDefinition = {
  service_name: "salesforce_outgoing_task",
  name: "Task"
};

module.exports = {
  TaskWrite
};
