/* @flow */

import type { IAttributesMapper, TDeletedRecordInfo, TResourceType } from "../../../../types";

const _ = require("lodash");


function saveDeletedRecords(type: TResourceType, records: Array<TDeletedRecordInfo>, attributesMapper: IAttributesMapper, hullClient: Object): Promise<*> {
  const promises = [];

  _.forEach(records, (record) => {
    const scopedClient = type === "Account" ?
      hullClient.asAccount({ anonymous_id: `salesforce:${record.id}` }) : hullClient.asUser({
        anonymous_id: `salesforce-${type.toLowerCase()}:${record.id}`
      });

    const attribs = attributesMapper.mapToHullDeletedObject(type, record.deletedDate);

    promises.push(scopedClient.traits(attribs)
      .then(() => {
        scopedClient.logger.info(`incoming.${type.toLowerCase() === "account" ? "account" : "user"}.success`, { traits: attribs });
      })
      .catch((error) => {
        scopedClient.logger.error(`incoming.${type.toLowerCase() === "account" ? "account" : "user"}.error`, { error });
      }));
  });

  return Promise.all(promises);
}

module.exports = {
  saveDeletedRecords
};
