/* @flow */
import type { TPrivateSettings } from "../types";

const _ = require("lodash");

function addCustomFields(
  privateSettings: Object = {},
  type: string,
  fields: Array<string>
): Array<string> {
  if (type === "Task") {
    const external_id_field = _.get(
      privateSettings,
      "salesforce_external_id",
      null
    );
    if (!_.isNil(external_id_field)) {
      fields.push(external_id_field);
    }
  }
  return fields;
}

function shouldFetch(
  privateSettings: TPrivateSettings,
  type: string,
  fields: Array<string>,
  hullClient: Object
): boolean {
  const entityToFetch = _.get(privateSettings, "entity", null);
  const fetchAccounts = _.get(privateSettings, "fetch_accounts", false);
  const fetchTasks = _.get(privateSettings, "fetch_tasks", false);

  if (
    !_.isNil(entityToFetch) &&
    entityToFetch !== "all" &&
    entityToFetch !== type
  ) {
    return false;
  }

  if (type === "Task" && !fetchTasks) {
    hullClient.logger.debug("Fetch Tasks not turned on. Skipping task fetch");
    return false;
  }

  if (type === "Account" && !fetchAccounts) {
    hullClient.logger.debug(
      "Fetch Accounts not turned on. Skipping account fetch"
    );
    return false;
  }

  if (!fields || fields.length === 0) {
    hullClient.logger.info(
      `Fetch ${type} does not have any fields defined. Skipping ${type} fetch`
    );
    return false;
  }

  return true;
}

module.exports = {
  shouldFetch,
  addCustomFields
};
