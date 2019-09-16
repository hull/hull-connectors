/* @flow */

import { PipedrivePersonRead, PipedriveOrgRead } from "./service-objects";

const {
  ifL,
  route,
  cond,
  settings,
  set,
  loopL,
  loopEndL,
  Svc,
  hull,
  iterateL,
  cast,
  transformTo,
  settingsUpdate,
  utils,
  ld,
  inc
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
const { orgFields, personFields } = require("./fielddefs");

function pipedrive(op: string, param?: any): Svc { return new Svc({ name: "pipedrive", op }, param) }

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
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
    route("orgFetchAll")
  ],
  personFetchAll: [
    set("start", 0),
    loopL([
      set("personPage", pipedrive("getAllPersonsPaged")),
      iterateL("${personPage.data}", { key: "pipedrivePerson", async: true },
        hull("asUser", cast(PipedrivePersonRead, "${pipedrivePerson}"))
      ),
      ifL(cond("isEqual", "${personPage.additional_data.pagination.more_items_in_collection}", false), {
          do: loopEndL(),
          eldo: set("start", inc("${start}"))
      })
    ])
  ],
  orgFetchAll: [
    set("start", 0),
    loopL([
      set("orgPage", pipedrive("getAllOrgsPaged")),
      iterateL("${orgPage.data}", { key: "pipedriveOrg", async: true},
        hull("asAccount", cast(PipedriveOrgRead, "pipedriveOrg"))
      ),
      ifL(cond("isEqual", "${orgPage.additional_data.pagination.more_items_in_collection}", false), {
          do: loopEndL(),
          eldo: set("start", inc("${start}"))
      })
    ])
  ],
  fieldsPipedrivePersonInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, personFields)),
  fieldsPipedriveOrgInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, orgFields)),
  refreshToken:
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      set("connectorHostname", utils("getConnectorHostname")),
      set("refreshAuthorizationHeader", utils("base64Encode", `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)),
      ifL(cond("notEmpty", set("refreshTokenResponse", pipedrive("refreshToken", refreshTokenDataTemplate))),
          settingsUpdate({
            expires_in: "${refreshTokenResponse.expires_in}",
            refresh_token: "${refreshTokenResponse.refresh_token}",
            access_token: "${refreshTokenResponse.access_token}"
          })
        )
    ])
};

module.exports = glue;
