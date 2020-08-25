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
  ld,
  hull,
  Svc
} = require("hull-connector-framework/src/purplefusion/language");

const { BigqueryUserRead, BigqueryAccountRead, BigqueryEventRead } = require("./service-objects");
const { HullIncomingUser, HullIncomingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");

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

const OPERATION_MAPPING = {
  users: {
    hull: "asUser",
    type: BigqueryUserRead,
    transformTo: HullIncomingUser
  },
  accounts: {
    hull: "asAccount",
    type: BigqueryAccountRead,
    transformTo: HullIncomingAccount
  },
  events: {
    hull: "asUser",
    type: BigqueryEventRead,
    transformTo: HullIncomingUser
  }
};

const glue = {
  ensure: [
    set("jobId", settings("job_id")),
    set("projectId", settings("project_id")),
    set("importType", settings("import_type")),
    set("operation", get("${importType}", OPERATION_MAPPING)),
    set("service_name", "bigquery")
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
      ifL(cond("isEqual", "${jobStatus.status.state}", "DONE"), {
        do: [
          ifL([
            cond("isEmpty", "${jobStatus.status.errorResult}"),
            cond("isEmpty", "${jobStatus.status.errors}")
          ], {
            // all good, ready for import
            do: route("importResults"),
            // job is finished but has some errors
            eldo: utils("logError", "${jobStatus.status.errors}")
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
            eldo: utils("logInfo", "${jobStatus.statistics}")
          })
      }),
    ])
  ],
  import: [],
  manualImport: ifL(route("isConfigured"), [
    set("nowTime", ex(moment(), "unix")),
    set("jobId", "hull_import_${connector.id}_${nowTime}"),
    ifL(cond("isEmpty", get("error", bigquery("insertQueryJob", jobPayloadTemplate))), [
      settingsUpdate({ job_id: "${jobId}"}),
      route("checkJob")
    ])
  ]),
  importResults: [
    set("queryPageResults", bigquery("getJobResults")),
    set("arrangedResults", jsonata("($f := $.schema.fields; rows.($merge($.f~>$map(function($v, $i) { {$f[$i].name: $v.v} })))[])", "${queryPageResults}")),
    iterateL("${arrangedResults}", { key: "entity", async: true }, [
      // cast("${operation.type}", "${entity}")
      hull("${operation.hull}", cast("${operation.type}", "${entity}"))
    ])
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
