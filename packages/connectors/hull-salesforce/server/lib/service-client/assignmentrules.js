/* @flow */
import type { TResourceTypeAssignmentRule } from "../types";

const Promise = require("bluebird");
const _ = require("lodash");

const Connection = require("./connection");

/**
 * Describes an assignment rule in Salesforce.
 *
 * @export
 * @interface AssignmentRule
 */
export type TAssignmentRule = {
  id: string,
  name: string
};

/**
 * Retrieves all defined assignment rules for the specified object type.
 *
 * @export
 * @param {Connection} conn The connection to use to communicate with the API.
 * @param {TResourceTypeAssignmentRule} type The object type to retrieve assignment rules for.
 * @returns {Promise<AssignmentRule[]>} A Promise that wraps an array of assignment rules.
 */
function getAssignmentRules(conn: Connection, type: TResourceTypeAssignmentRule): Promise<Array<TAssignmentRule>> {
  return new Promise((resolve, reject) => {
    conn.query(`SELECT Id, Name FROM AssignmentRule WHERE SobjectType = '${type}'`, (err, result) => {
      if (err) {
        return reject(err);
      }
      const res: Array<TAssignmentRule> = _.map(result.records, (r) => {
        return {
          id: _.get(r, "Id"),
          name: _.get(r, "Name")
        };
      });
      return resolve(res);
    });
  });
}

module.exports = getAssignmentRules;
