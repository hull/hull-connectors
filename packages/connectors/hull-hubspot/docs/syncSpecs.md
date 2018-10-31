## A regularly scheduled sync (as frequent as possible)

To fetch all new and updated customers in Hubspot and store them as Hull users and update those already in there.

```javascript

// deps:
// this.hull
// this.hubspot
// this.mapping
// this.queue

function syncAction(req, res) {
    return this.getLastUpdate()
        .then((lastImportTime) => {
            return this.queue("syncJob", lastImportTime);
        })
        .then(() => res.end("ok"));
}

function syncJob(lastImportTime, count = 100, offset = 0) {
    return this.getRecentContacts(lastImportTime, count, offset)
        .then(({ recentlyModified, offset }) => {
            if (recentlyModified.length > 0) {
                this.queue("syncJob", lastImportTime, count, offset);
                this.queue("importContacts", recentlyModified);
            }
        });
}

/**
 * Get information about last import done from hubspot
 * @return {Promise -> lastImportTime (ISO 8601)} 2016-08-04T12:51:46Z
 */
function getLastUpdate() {
    this.hull.get("/search/user_reports", {
        include: ["hubspot/fetched_at"],
        sort: {
            hubspot/fetched_at: "desc"
        },
        per_page: 1
    })
    .then((r) => r.data[0]['traits_hubspot/fetched_at']);
}

/**
 * Get most recent contacts and filters out these who last modification
 * time if older that the lastImportTime. If there are any contacts modified since
 * that time queues import of them and getting next chunk from hubspot API.
 * @see http://developers.hubspot.com/docs/methods/contacts/get_recently_updated_contacts
 * @param  {Date} lastImportTime
 * @param  {Number} [count=100]
 * @param  {Number} [offset=0]
 * @return {Promise -> Array}
 */
function getRecentContacts(lastImportTime, count = 100, offset = 0) {
    const properties = this.mapping.getHubspotPropertiesKeys();

    return this.hubspot.request()
    .get("/contacts/v1/lists/recently_updated/contacts/recent")
    .query({
        count,
        vidOffset: offset,
        property: properties
    })
    .then((res) => {
        return res.contacts.filter((c) => {
            const recentlyModified = moment(c.properties.lastmodifieddate)
                .isAfter(lastImportTime);

            return { recentlyModified, offset: res["vid-offset"] };
        });
    });
}
```
