/* @flow */

const Promise = require("bluebird");
const _ = require("lodash");
const { shouldFetch, addCustomFields } = require("../../../../utils/fetch-utils");
const { saveRecord } = require("../save/save-record");
const { getResourceSchema } = require("../../../../utils/get-fields-schema");

async function fetchAllRecords({ entity, privateSettings, syncAgent }: Object): Promise<*> {
  const mappings = syncAgent.mappings;
  const hullClient = syncAgent.hullClient;
  const fetchResourceSchema = syncAgent.fetchResourceSchema;
  const cache = syncAgent.cache;
  const serviceClient = syncAgent.sf;
  const accountClaims = _.get(privateSettings, "account_claims", []);

  return Promise.mapSeries(_.values(mappings), async ({ type, fetchFields }) => {
    let fields = _.keys(fetchFields);
    if (shouldFetch(_.merge({}, privateSettings, { entity }), type, fields, hullClient)) {
      hullClient.logger.info("incoming.job.start", {
        jobName: "fetchAll",
        type,
        fetchFields: fields,
        identMapping: _.get(privateSettings, "account_claims", []) });

      fields = addCustomFields(privateSettings, type, fields);

      let resourceSchema = {};
      try {
        resourceSchema = await getResourceSchema(type, { fetchResourceSchema, cache, serviceClient });
      } catch (error) {
        hullClient.logger.warn("incoming.job.warning", {
          error,
          errorMessage: _.isFunction(error.toString) ? error.toString() : "Unknown error.",
          warning: "Unable to find resource schema.",
          type });
      }

      return serviceClient.getAllRecords(type, fields, accountClaims, (record) => {
        return saveRecord({ privateSettings, syncAgent, record, resourceSchema });
      })
        .then(() => {
          hullClient.logger.info("incoming.job.success", { jobName: "fetchAll", type });
        })
        .catch((err) => {
          hullClient.logger.error("incoming.job.error", { job: "fetchAll", type, message: err.message, status: err.status });
          return Promise.reject(err);
        });
    }
    return Promise.resolve({
      status: 200,
      data: { status: "ok" }
    });
  });
}

module.exports = {
  fetchAllRecords
};
