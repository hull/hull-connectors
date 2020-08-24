import { HullIncomingEvent } from "hull-connector-framework/src/purplefusion/hull-service-objects";
import { IntercomWebhookEventRead } from "hull-intercom/server/service-objects";

const {
  ifL,
  cond,
  settings,
  settingsUpdate,
  set,
  ex,
  utils,
  moment,
  route,
  cast,
  get,
  returnValue,
  transformTo,
  jsonata,
  or,
  iterateL,
  filter,
  hull,
  Svc
} = require("hull-connector-framework/src/purplefusion/language");

const { BigqueryProjectsMap } = require("./service-objects");
const { HullEnumMap } = require("hull-connector-framework/src/purplefusion/hull-service-objects");

function bigquery(op: string, param?: any): Svc {
  return new Svc({ name: "bigquery", op }, param);
}

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  grant_type: "refresh_token"
};

const jobPayloadTemplate = {
    configuration: {
      query: {
        query: "${connector.private_settings.query}",
        useLegacySql: false,
      }
    },
    jobReference: {
      projectId: "${projectId}",
      jobId: "${jobId}"
    },
  };

const glue = {
  ensure: [
    set("jobId", settings("job_id")),
    set("projectId", settings("project_id")),
    set("importType", settings("import_type")),
  ],
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("access_token")),
    cond("notEmpty", settings("refresh_token")),
    cond("notEmpty", settings("project_id"))
  ]),
  getProjects: returnValue([
    ifL(route("isConfigured"), [
      set("projectsMap", jsonata(`[$.{"value": id, "label":friendlyName}]`, bigquery("getProjects")))
    ])
    ],
    {
      status: 200,
      data: {
        options: "${projectsMap}"
      }
    }
  ),
  status: ifL(route("isConfigured"), {
    do: ifL(cond("notEmpty", settings("query")), {
      do: {
        status: "ok"
      },
      eldo: {
        status: "setupRequired",
        message: "You haven't saved a query yet, nothing will be imported."
      }
    }),
    eldo: {
      status: "setupRequired",
      message: "Please authenticate and select a Google Cloud project."
    }
  }),
  checkJob: [
    ifL(or([
      cond("notEmpty", settings("job_id")),
      cond("notEmpty", "${jobId}")
    ]), [
      set("jobStatus", bigquery("getJob")),
      ifL(cond("isEqual", get("jobStatus.status.state"), "DONE"), {
        do: [
          ifL([
            cond("isEmpty", get("jobStatus.status.errorResult")),
            cond("isEmpty", get("jobStatus.status.errors"))
          ], {
            // all good, ready for import
            do: route("importResults"),
            // job is finished but has some errors
            eldo: utils("logError", get("jobStatus.status.errors"))
          }),
          // In any case, we no longer follow the job
          settingsUpdate({ job_id: null })
        ],
        eldo:
          ifL(cond("isEmpty", "${jobStatus}"), {
            do: [
              utils("logInfo", "The tracked job ${jobId} doesn't exist or has been removed, skipping"),
              settingsUpdate({ job_id: null }),
            ],
            eldo: utils("logInfo", get("jobStatus.statistics"))
          })
      }),
    ])
  ],
  import: [],
  manualImport: returnValue([
    ifL(route("isConfigured"), [
      set("nowTime", ex(moment(), "unix")),
      set("jobId", "hull_import_${connector.id}_${nowTime}"),
      ifL(cond("isEmpty", get("error", bigquery("insertQueryJob", jobPayloadTemplate))), [
        settingsUpdate({ job_id: "${jobId}"}),
        route("checkJob")
      ])
    ])
  ], {
    status: 200,
    message: "ok"
  }),
  importResults: [
    set("queryPageResults", bigquery("getJobResults")),
    set("arrangedResults", jsonata("($f := $.schema.fields; rows.($merge($.f~>$map(function($v, $i) { {\"bigquery/\" & $f[$i].name: $v.v} }))))", "${queryPageResults}")),
    iterateL("${arrangedResults}", { key: "entity", async: true }, [
      ifL(cond("isEqual", "${importType}", "users"), [
        set("identity", { email: "${entity.bigquery/email}", external_id: "${entity.bigquery/external_id}"}),
        ifL(cond("notEmpty", "${entity.bigquery/anonymous_id}"), set("identity.anonymous_id", "bigquery:${entity.bigquery/anonymous_id}")),
        hull("asUser", {
          ident: "${identity}",
          attributes: "${entity}"
        })
      ]),
      ifL(cond("isEqual", "${importType}", "accounts"), [
        set("identity", { domain: "${entity.domain}", external_id: "${entity.external_id}"}),
        ifL(cond("notEmpty", "${entity.anonymous_id}"), set("identity.anonymous_id", "bigquery:${entity.anonymous_id}")),
        hull("asAccount", {
          ident: "${identity}",
          attributes: "${entity}"
        })
      ]),
      ifL(cond("isEqual", "${importType}", "events"), [
        set("identity", { email: "${entity.email}", external_id: "${entity.external_id}"}),
        ifL(cond("notEmpty", "${entity.anonymous_id}"), set("identity.anonymous_id", "bigquery:${entity.anonymous_id}")),
        hull("asUser", {
          ident: "${identity}",
          events: [
            "${entity}"
          ]
        })
      ])
    ]),
  ],
  refreshToken:
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      ifL(cond("notEmpty", set("refreshTokenResponse", bigquery("refreshToken", refreshTokenDataTemplate))),
        settingsUpdate({
          access_token: "${refreshTokenResponse.access_token}",
          token_expires_in: "${refreshTokenResponse.expires_in}",
          token_fetched_at: ex(ex(moment(), "utc"), "format"),
        })
      )
    ]),
  stopTracking: [
    utils("logInfo", "The tracked job ${jobId} doesn't exist or has been removed, skipping"),
    settingsUpdate({ job_id: null }),
    set("jobId", null)
  ]
};

module.exports = glue;
