/* @flow */

const Promise = require("bluebird");
const _ = require("lodash");
const { shouldFetch } = require("../../../../utils/fetch-utils");
const { saveRecord } = require("../save/save-record");
const { saveDeletedRecords } = require("../save/save-deleted-records");
const moment = require("moment");

async function fetchDeletedRecords({ privateSettings, syncAgent }: Object): Promise<*> {
  const sf = syncAgent.sf;
  const attributesMapper = syncAgent.attributesMapper;
  const mappings = syncAgent.mappings;
  const hullClient = syncAgent.hullClient;
  const resourceSchema = {};
  const since = moment().subtract(6, "minute").toDate();


  return Promise.mapSeries(_.values(mappings), ({ type, fetchFields }) => {
    const fields = _.keys(fetchFields);

    if (shouldFetch(privateSettings, type, fields, hullClient)) {
      const accountClaims = _.get(privateSettings, "account_claims", []);
      hullClient.logger.info("incoming.job.start", { jobName: "fetchDeleted", type });

      try {
        if (type === "Account" || type === "Contact" || type === "Lead") {
          return sf.getDeletedRecordsData(type, { start: since, end: new Date() })
            .then((deletedRecords) => {
              return saveDeletedRecords(type, deletedRecords, attributesMapper, hullClient);
            })
            .then(() => {
              hullClient.logger.info("incoming.job.success", { jobName: "fetchDeleted", type });
            });
        } else if (type === "Task") {
          return sf.getDeletedRecords(type, _.merge({}, privateSettings, { since, fields, accountClaims }), (record) => {
            return saveRecord({ privateSettings, syncAgent, record, resourceSchema });
          }).then(() => {
            hullClient.logger.info("incoming.job.success", { jobName: "fetchDeleted", type });
          });
        }
      } catch (error) {
        hullClient.logger.error("incoming.job.error", {
          job: "fetchDeleted",
          type,
          message: error.message,
          status: error.status
        });
        return Promise.reject(error);
      }
    }
    hullClient.logger.info("incoming.job.success", { jobName: "fetchDeleted", type });
    return Promise.all([]);
  });
}

module.exports = {
  fetchDeletedRecords
};
