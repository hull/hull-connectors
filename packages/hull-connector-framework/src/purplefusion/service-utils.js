/* @flow */
const moment = require("moment");
const _ = require("lodash");

function startImportJob(context, url, partNumber, size, importId) {

  const importType = "users";
  const params = {
    url,
    format: "json",
    notify: false,
    emit_event: false,
    overwrite: true,
    name: `Import for ${context.connector.name}`,
    // scheduling all parts for right now.  Doesn't seem to work if schedule_at is removed
    // dashboard says "Invalid Date"
    schedule_at: moment().toISOString(),
    stats: { size },
    size,
    import_id: importId,
    part_number: partNumber
  };

  context.client.logger.info("incoming.job.progress", { jobName: "sync", stepName: "import", progress: partNumber, options: _.omit(params, "url"), type: importType });

  return context.client.post(`/import/${importType}`, params)
    .then(job => {
      return { job, partNumber };
    });
}

module.exports = {
  startImportJob
};
