/* @flow */

const {
  ifL,
  route,
  cond,
  settings,
  set,
  loopL,
  Svc,
  hull,
  iterateL
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullOutgoingAccount,
  HullOutgoingUser,
  HullOutgoingDropdownOption,
  HullIncomingDropdownOption,
  HullConnectorAttributeDefinition,
  WebPayload
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const _ = require("lodash");

function pipedrive(op: string, param?: any): Svc { return new Svc({ name: "pipedrive", op }, param) }

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "https://${connectorHostname}/auth/callback",
  grant_type: "refresh_token"
};

const glue = {
  status: ifL(cond("isEmpty", settings("access_token")), {
    do: {
      status: "setupRequired",
      message: "'Connector has not been authenticated. Please make sure to allow Hull to access your Pipedrive data by going to the \"Settings\" tab and clicking \"Login to your Pipedrive account\" in the \"Connect to Pipedrive\" section'"
    },
    eldo: {
      status: "ok",
      message: "allgood"
    }
  }),
  ensureHook: set("service_name", "pipedrive"),
  fetchAll: [
    route("personFetchAll"),
    // route("orgFetchAll")
  ],
  personFetchAll: [
    set("start", 0),
    loopL([
      set("pipedrivePersons", pipedrive("getAllPersonsPaged")),
      iterateL("${pipedrivePersons}", { key: "pipedrivePerson", async: true },
        hull("asUser", "${pipedrivePerson}")
      )
    ])
  ]
};

module.exports = glue;
