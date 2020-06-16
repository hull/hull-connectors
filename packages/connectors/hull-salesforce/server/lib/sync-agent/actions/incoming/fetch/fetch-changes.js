/* @flow */

const Promise = require("bluebird");
const _ = require("lodash");
const { shouldFetch, addCustomFields } = require("../../../../utils/fetch-utils");
const { saveRecord } = require("../save/save-record");
const moment = require("moment");
const { getResourceSchema } = require("../../../../utils/get-fields-schema");

async function fetchChanges({ privateSettings, syncAgent }: Object): Promise<*> {
  const attributesMapper = syncAgent.attributesMapper;
  const mappings = syncAgent.mappings;
  const hullClient = syncAgent.hullClient;
  const fetchResourceSchema = syncAgent.fetchResourceSchema;
  const cache = syncAgent.cache;
  const serviceClient = syncAgent.sf;

  const since = moment().subtract(6, "minute").toDate();

  return Promise.mapSeries(_.values(mappings), async ({ type, fetchFields }) => {
    let fields = _.keys(fetchFields);
    const recordIdents = [];
    if (shouldFetch(privateSettings, type, fields, hullClient)) {
      const accountClaims = _.get(privateSettings, "account_claims", []);

      hullClient.logger.info("incoming.job.start", { jobName: "fetchChanges", type, fetchFields: fields, identMapping: accountClaims });

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

      return serviceClient.getUpdatedRecords(type, _.merge({}, privateSettings, { fields, since }), (record) => {
        const recordType: any = _.has(record, "attributes.type") ? record.attributes.type : "unknown";

        recordIdents.push(attributesMapper.mapToHullIdentObject(recordType, record));
        return saveRecord({ privateSettings, syncAgent, record, resourceSchema });
      })
        .then(() => {
          // create a array of natural identities, otherwise if we have anonymous_id
          // will never be able to detect duplicates
          const pickNaturalKeyFunction = (value: any, key: string): boolean => key !== "anonymous_id";
          const naturalIdents = recordIdents.map(ident => _.pickBy(ident, pickNaturalKeyFunction));
          const duplicates = _(naturalIdents).groupBy(JSON.stringify).pickBy(d => d.length > 1).value();
          _.forEach(duplicates, (value, key) => {
            try {
              const ident = JSON.parse(key);
              hullClient.logger.warn("incoming.job.warning", { warning: "Found duplicated objects while fetching from SFDC", ident, type, count: value.length });
            } catch (error) {} // eslint-disable-line no-empty
          });
          hullClient.logger.info("incoming.job.success", { jobName: "fetchChanges", type });
        })
        .catch((err) => {
          hullClient.logger.error("incoming.job.error", { job: "fetchChanges", type, message: err.message, status: err.status });
          return Promise.reject(err);
        });
    }
    return Promise.resolve();
  });
}

module.exports = {
  fetchChanges
};
