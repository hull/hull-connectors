## A `/batch` endpoint

The bath will handle the batch operation syncing users from Hull to Hubspot

```javascript
// deps:
// this.hull
// this.hubspot
// this.mapping
// this.queue

/**
 * public method which queues the handleBatchExtractJob
 * @param  {Object} req
 * @param  {Object} res
 * @return {Promise}
 */
function batchAction(req, res) {
    return this.queue("handleBatchExtractJob", req.body, 100)
        .then(() => res.end("ok"));
}

/**
 * Parses the extract results and queues chunks for export operations
 * @param  {String} body
 * @param  {Number} chunkSize
 * @return {Promise}
 */
function handleBatchExtractJob(body, chunkSize) {
    return handleExtract(req.body, chunkSize, (usersBatch) => {
        const filteredUsers = usersBatch.filter((user) => this.shouldSyncUser(user));
        return this.queue("exportUsersJob", filteredUsers);
    });
}

/**
 * Exports Hull users to Hubspot contacts using create or update strategy.
 * The job on Hubspot side is done async the returned Promise is resolved
 * when the query was queued successfully. It is rejected when:
 * "you pass an invalid email address, if a property in your request doesn't exist,
 * or if you pass an invalid property value."
 * @see http://developers.hubspot.com/docs/methods/contacts/batch_create_or_update
 * @param  {Array} users users from Hull
 * @return {Promise}
 */
function exportUsersJob(users) {

    if (users.count > 100) {
        this.hull.logger.warning("exportUsers works best for under 100 users at once", users.count);
    }

    const body = users.map((user) => {
        const properties = this.mapping.getHubspotProperties(user);
        return {
            email: user.email,
            properties
        };
    });

    return this.hubspot.post(`/contacts/v1/contact/batch/`, body);
}

```
