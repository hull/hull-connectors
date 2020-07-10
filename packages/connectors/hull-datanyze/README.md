# Setup

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-hubspot)

---

### Using :

[See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-hubspot.herokuapp.com)

### Developing :

- Fork
- Install
- Start Redis instance
- Copy .env.sample -> .env and set CLIENT_ID, CLIENT_SECRET, REDIS_URL

```sh
npm install
npm start
npm run start:dev # for autoreloading after changes
```

#### Docker based

If you want Docker based development after setting `.env` file:

```sh
docker-compose run install
docker-compose up -d redis
docker-compose up dev # with autoreloading enabled
```

### Testing :
- create developer account at https://developers.hubspot.com/docs/overview
- from developer's account dashboard you should obtain CLIENT_ID and CLIENT_SECRET and paste it to .env file


### Logs :
  warn : 
    - incoming.user.warning - logged when getting hull traits
    - sendUsersJob works best for under 100 users at once - logged when trying to send more than 100 users
    - Error in ContactProperty sync - logged when encountered some problems in contact property
  info :
  
  error :
    - requestExtract.error - logged when extracting request for segments update/delete
    - Hubspot batch error - logged when encountered some problems with sending users batch
    - sendUsers.error - general error logged when send users operation will fail
    - shipUpdateJob.err - general error logged when setting up ship
    - non recoverable error - log that indicates some unknown problems
    - checkToken: Ship private settings lack token information - connector private settings missing token information
    - Error in refreshAccessToken - logged when encountered some problems while refreshing hubspot access token
    - getContact gets maximum of 100 contacts at once - logged when contacts list from hubspot exceeds 100 objects
    
### Status : 

  * `Hubspot is not properly configured {error}` - when hubspot configuration is invalid. See {error} for details.
  * `Missing API token` - when api token is undefined
  * `Missing refresh token` - when api refresh token is undefined
  * `Missing portal id` - when portal id is undefined
  * `No fields are going to be sent from hull to hubspot because of missing configuration` - when no Custom Fields Sync (Hull to Hubspot) are defined
  * `No fields are going to be sent from hubspot to hull because of missing configuration` - when no Custom Fields Sync (Hubspot to Hull) are defined
  * `No segments will be synchronized because of missing configuration` - when no Segments in connector's settings are defined
  * `Got Zero results when fetching contacts` - when trying to fetch users and got no results
  * `Could not get response from Hubspot due to error {error}` - when integration with hubspot fails
  * `Connector is missing configuration` - when hubspotAgent is undefined 
  

# New documentation


## Authorization
- we perform the oauth flow to obtain the `access_token` and `refresh_token`.
- the `access_token` is valid for 6 hours, so we have a `schedule` which is checking if the `access_token` is about to expire and perform the refresh rotating the `access_token` in connector settings

**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

- `GET https://app.hubspot.com/oauth/authorize`
- `POST /oauth/v1/token`

---

## Required Configuration
- none, after the connector is authorized it starts to operate

---

## Optional Configuration
- outgoing user segment filter
- outgoing user attributes mapping
- incoming user attributes mapping
- outgoing account segment filter
- outgoing account attributes mapping
- outgoing user to account linking toggle
- incoming account attributes mapping
- incoming user to account linking toggle

**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

- `GET /properties/v1/contacts/properties`
- `GET /properties/v1/companies/properties`

---

## Config synchronization

- following attributes mapping logic is the same for both users and accounts
- for both contacts and companies we create a custom property group called `Hull`
- in connector codebase we store information about all default fields to fetch
- then if the customer adds new entry to the mapper we check if this is an existing property, if it exists we write data there, if it does not, we create new property in our custom property group and prepend it with `hull_` prefix

**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

- `POST /contacts/v2/groups`
- `PUT /contacts/v2/properties/named/{{propertyName}}`
- `POST /contacts/v2/properties`
- `POST /properties/v1/companies/groups`
- `PUT /properties/v1/companies/properties/named/{{propertyName}}`
- `POST /properties/v1/companies/properties`

---

## Incoming flow

### Users
- we provide a button on the workspace of the connector to fetch all contacts
- additionaly we register a schedule to run every 5 minutes to fetch contacts which are updated in previous 5 minutes, we store a timestamp in `connector private settings` to know when to stop next pagination. The endpoint returns the most recently modified record first and we move back in the history, but each record apprears there once. The pagination can be done via id offset.
- in both cases we apply attributes mapper with default fields being fetched at all times and with custom mapping provided in the settings
- we set `email` and `anonymous_id` as `user indentification claims`

**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

- `GET /contacts/v1/lists/all/contacts/all`
- `GET /contacts/v1/lists/recently_updated/contacts/recent`

### UserEvents
*NOT IMPLEMENTED*

### Accounts
- we provide a button on the workspace of the connector to fetch all companies
- additionaly we register a schedule to run every 5 minutes to fetch companies which are updated in previous 5 minutes, we store a timestamp in `connector private settings` to know when to stop next pagination. The endpoint returns the most recently modified record first and we move back in the history, but each record apprears there once. The pagination can be done via id offset.
- in both cases we apply attributes mapper with default fields being fetched at all times and with custom mapping provided in the settings
- we set `domain` and `anonymous_id` as `account indentification claims`

**logs**

TBD

**metrics**

TBD

**external API endpoints**

- `GET /companies/v2/companies/paged`
- `GET /companies/v2/companies/recent/modified`

---

## Outgoing flow

### Users

*TBD*

**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

*TBD*

### UserEvents
*NOT IMPLEMENTED*

### Accounts

- if this is a change we skip accounts based on the outgoing account segment settings, in case of batch we do not skip here
- then before doing an update and insert operations we perform a search by `domain` trait for each, if we have any result we take the oldest company and make the account update this specific company
- then we perform an update and insert operations separately


**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

---

## Status Check

*TBD*

**logs**

*TBD*

**metrics**

*TBD*

**external API endpoints**

*TBD*

---

## Destroy
*NOT IMPLEMENTED*
