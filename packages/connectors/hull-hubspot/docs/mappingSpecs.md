## A `mapping` utility

Mapping should map data both ways between Hull and Hubspot data structures

```javascript
// deps:
// it should have a dependency on hull ship settings

const map = [
    { name: "email", hull: "email", type: "string",  title: "Email" },
    { name: "salutation", hull: "hubspot/salutation", type: "string",  title: "Salutation" },
    { name: "firstname", hull: "hubspot/first_name", type: "string",  title: "First Name" },
    { name: "lastname", hull: "hubspot/last_name", type: "string",  title: "Last Name" },
    { name: "phone", hull: "hubspot/phone", type: "string",  title: "Phone Number" },
];

/**
 * Returns the Hubspot properties names.
 * When doing a sync we need to download only those
 * @return {Array}
 */
function getHubspotPropertiesKeys() {
    return this.map.map((prop) => prop.name);
}

/**
 * Returns the Hull traits names.
 * Useful when doing request extract calls
 * @return {Array}
 */
function getHullTraitsKeys() {
    return this.map.map((prop) => prop.hull);
}


/**
 * Maps Hubspot contact properties to Hull traits
 * @param  {Object} userData Hubspot contact
 * @return {Object}          Hull user traits
 */
function getHullTraits(userData) {
    return this.map.reduce((traits, prop) => {
        return traits[prop.hull] = _.get(userData, `properties[${prop.name}].value`);
    }, {});
}

/**
 * Maps Hull user data to Hubspot contact properties
 * @see http://developers.hubspot.com/docs/methods/contacts/update_contact
 * @param  {Object} userData Hull user object
 * @return {Array}           Hubspot properties array
 */
function getHubspotProperties(userData) {
    return this.map.map((prop) => {
        return {
            property: prop.name,
            value: _.get(userData, prop.hull)
        }
    });
}
```
