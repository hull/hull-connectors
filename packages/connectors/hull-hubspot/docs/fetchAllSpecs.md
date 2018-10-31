## A button to "Fetch all" customers from Hubspot

Will fetch all customers from Hubspot, using Batching if needed, and store their properties in Hull customers, upserting those that already exist (found by email)

```javascript

// deps:
// this.hull
// this.hubspot
// this.mapping -> mappingSpecs.md
// this.queue

/**
 * public facing method
 * @return {Promise}
 */
function fetchAllAction(req, res) {
    const count = 100;
    return this.queue("fetchAllJob", count)
        .then(() => res.end("ok"));
}

/**
 * Job which performs fetchAll operations queues itself and the import job
 * @param  {Number} count
 * @param  {Number} [offset=0]
 * @return {Promise}
 */
function fetchAllJob(count, offset = 0) {
    return this.getContacts(count, offset)
        .then((res) => {
            if (res.body["has-more"]) {
                this.queue("fetchAllJob", count, res.body["vid-offset"]);
            }

            if (res.body.contacts > 0) {
                this.queue("importContactsJob", res.body.contacts);
            }
        });
}

/**
 * Get 100 hubspot contacts and queues their import
 * and getting another 100 - needs to be processed in one queue without
 * any concurrency
 * @see http://developers.hubspot.com/docs/methods/contacts/get_contacts
 * @param  {Number} [count=100]
 * @param  {Number} [offset=0]
 * @return {Promise}
 */
function getContacts(count = 100, offset = 0) {

    if (count > 100) {
        return this.hull.logger.error("getContact gets maximum of 100 contacts at once", count);
    }

    const properties = this.mapping.getHubspotPropertiesKeys();

    return this.hubspot.get("/contacts/v1/lists/all/contacts/all", {
        count,
        vidOffset: offset,
        property: properties
    });
}

/**
 * creates or updates users
 * @see https://www.hull.io/docs/references/api/#endpoint-traits
 * @param  {Array} Hubspot contacts
 * @return {Promise}
 */
function importContactsJob(contacts) {
    return contact.map((c) => {
        const email = _.find(c.identities, { type: "EMAIL" }).value;
        const traits = this.mapping.getHullTraits(c);
        return this.hull.as({ email }).traits(traits, { source: "hubspot "});
    });
}

```
