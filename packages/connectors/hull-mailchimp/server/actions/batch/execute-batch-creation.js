/* @flow */
async function executeBatchCreation({ syncAgent, operations, importType }) {
  try {
    const batchJob = await syncAgent.mailchimpClient
      .createBatchJob({ operations })
      .then(responseBody => {
        const { id } = responseBody;
        syncAgent.client.logger.info("incoming.job.start", {
          id,
          jobName: "mailchimp-batch-job",
          type: importType
        });
        return responseBody;
      });
    if (!batchJob) {
      return {
        status: 500,
        data: {
          message: "Batch creation failed"
        }
      };
    }

    return {
      status: 200,
      data: {
        id: batchJob.id,
        message: "Batch Job Initiated"
      }
    };
  } catch (error) {
    const filteredError = syncAgent.mailchimpClient.handleError(error);
    syncAgent.client.logger.info("incoming.job.error", {
      jobName: "mailchimp-batch-job",
      errors: filteredError.message
    });
    return Promise.reject(filteredError);
  }
}

module.exports = executeBatchCreation;
