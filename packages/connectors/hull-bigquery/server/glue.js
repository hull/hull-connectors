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
  Svc,
  input,
  cacheLock
} = require("hull-connector-framework/src/purplefusion/language");

const FULL_IMPORT_DAYS = process.env.FULL_IMPORT_DAYS || "10000";

const { BigqueryUserRead, BigqueryAccountRead, BigqueryEventRead } = require("./service-objects");
const { HullIncomingUser, HullIncomingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");

function bigquery(op: string, param?: any): Svc {
  return new Svc({ name: "bigquery", op }, param);
}

const jobPayloadTemplate = {
    configuration: {
      query: {
        query: "${formattedQuery}",
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
    cond("notEmpty", settings("service_account_key")),
    cond("notEmpty", settings("project_id")),
  ]),
  isAuthenticated: cond("allTrue", [
    cond("notEmpty", settings("access_token")),
    cond("notEmpty", settings("project_id"))
  ]),
  getProjects: returnValue([
      route("obtainAccessToken"),
      set("projectsMap", jsonata(`[$.{"value": id, "label":friendlyName}]`, bigquery("getProjects")))
    ],
    {
      status: 200,
      data: {
        options: "${projectsMap}"
      }
    }
  ),
  status: ifL(cond("isEmpty", settings("service_account_key")), {
    do: {
      status: "setupRequired",
      message: "Connector is missing Service Account Key which is required to call BigQuery API. Please update settings."
    },
    eldo: {
      status: "ok",
      message: ""
    }
  }),
  checkJob: cacheLock("checkJob", [
    ifL([
      route("isAuthenticated"),
      or([
        cond("notEmpty", settings("job_id")),
        cond("notEmpty", "${jobId}")
      ])
    ], [
      set("jobStatus", bigquery("getJob")),
      ifL(cond("isEqual", "${jobStatus.status.state}", "DONE"), {
        do: [
          ifL([
            cond("isEmpty", "${jobStatus.status.errorResult}"),
            cond("isEmpty", "${jobStatus.status.errors}")
          ], {
            // all good, ready for import
            do: [
              route("paginateResults"),
              utils("logInfo", "incoming.job.finished"),
              settingsUpdate({ last_sync_at: "${jobStatus.statistics.creationTime}"})
            ],
            // job is finished but has some errors
            eldo: utils("logError", "incoming.job.error: ${jobStatus.status.errors}")
          }),
          // In any case, we no longer follow the job
          settingsUpdate({ job_id: null })
        ],
        eldo:
          ifL(cond("isEmpty", "${jobStatus}"), {
            do: [
              utils("logInfo", "incoming.job.error: The tracked job ${jobId} doesn't exist or has been removed, skipping"),
              settingsUpdate({ job_id: null }),
            ],
            eldo: utils("logInfo", "incoming.job.progress: ${jobStatus.statistics}")
          })
      }),
    ])
  ]),
  startImport: [
    ifL(cond("isEmpty", "${jobId}"), {
      do: ifL(route("isAuthenticated"), [
        set("nowTime", ex(moment(), "unix")),
        set("jobId", "hull_import_${connector.id}_${nowTime}"),
        set("rawQuery", input()),
        route("variableReplacement"),
        ifL(cond("isEmpty", get("error", bigquery("insertQueryJob", jobPayloadTemplate))), [
          settingsUpdate({ job_id: "${jobId}"}),
          utils("logInfo", "incoming.job.start: ${jobStatus.statistics}"),
          route("checkJob")
        ])
      ]),
      eldo: [
        utils("logError", "incoming.job.error: a job is already running. Wait for it to finish.")
      ]
    })
  ],
  scheduledImport: route("startImport", settings("query")),
  paginateResults: [
    set("queryPageResults", bigquery("getJobResults")),
    set("arrangedResults", jsonata("[$.rows.(\n" +
      "    $merge(\n" +
      "        $map($.f, function($v, $i) {\n" +
      "            {\n" +
      "                $$.schema.fields[$i].name: $v.v\n" +
      "            }\n" +
      "        })\n" +
      "    )\n" +
      ")]\n", "${queryPageResults}")),
    iterateL("${arrangedResults}", { key: "entity", async: true }, [
      hull("${operation.hull}", cast("${operation.type}", "${entity}"))
    ]),
    ifL(cond("notEmpty", "${queryPageResults.pageToken}"), [
      set("pageToken", "${queryPageResults.pageToken}"),
      route("paginateResults")
    ])
  ],
  obtainAccessToken:
    ifL(cond("notEmpty", "${connector.private_settings.service_account_key}"), [
      set("serviceAccountKey", jsonata("$eval(service_account_key)", "${connector.private_settings}")),
      set("serviceAccountEmail", "${serviceAccountKey.client_email}"),
      set("serviceAccountPrivateKey", "${serviceAccountKey.private_key}"),
      set("jwtPayload", {
        iss: "${serviceAccountKey.client_email}",
        scope: "https://www.googleapis.com/auth/bigquery.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: ex(ex(moment(), "add", 1, "hour"), "unix"),
        iat: ex(moment(), "unix")
      }),
      set("jwtAssertion", utils("jwtEncode", { payload: "${jwtPayload}", secret: "${serviceAccountPrivateKey}", algorithm: "RS256" })),
      ifL(cond("notEmpty", set("obtainAccessTokenResponse", bigquery("obtainAccessToken"))),
        settingsUpdate({
          access_token: "${obtainAccessTokenResponse.access_token}",
          token_expires_in: "${obtainAccessTokenResponse.expires_in}",
          token_type: "${obtainAccessTokenResponse.token_type}",
          token_fetched_at: ex(ex(moment(), "utc"), "format"),
        })
      )
    ]),
  admin: returnValue([
    ifL(cond("allTrue", [
      route("isConfigured"), route("isAuthenticated")
    ]), {
      do: [
        set("pageLocation", "connected.html"),
        set("retData", "${connector.private_settings}"),
        set("retData.query", settings("query")),
        set("retData.preview_timeout", settings("preview_timeout")),
        set("retData.last_sync_at", null),
        set("retData.import_type", settings("import_type"))
      ],
      eldo: [
        set("pageLocation", "home.html")
      ]
    })
  ], {
    pageLocation: "${pageLocation}",
    data: "${retData}"
  }),
  storedQuery: returnValue([
    set("trimmedQuery", ld("trimEnd", settings("query"), ";"))
  ], {
    data: "${trimmedQuery}"
  }),
  variableReplacement: [
    ifL(cond("isEmpty", settings("last_sync_at")), {
      do: set("lastSyncAt", ex(ex(ex(moment(), "subtract", FULL_IMPORT_DAYS, "days"), "utc"), "format", "YYYY-MM-DDThh:mm:ss")),
      eldo: set("lastSyncAt", ex(ex(moment(settings("last_sync_at")), "utc"), "format", "YYYY-MM-DDThh:mm:ss"))
    }),
    set("formattedQuery", ld("replace", "${rawQuery}", ":last_sync_at", '"${lastSyncAt}"')),
    set("importStartData", ex(ex(ex(moment(), "subtract", settings("import_days"), "days"), "utc"), "format", "YYYY-MM-DDThh:mm:ss")),
    set("formattedQuery", ld("replace", "${formattedQuery}", ":import_start_date", '"${importStartData}"'))
  ],
  run:
    returnValue([
      set("rawQuery", input("body.query")),
      route("variableReplacement"),
      set("finalQuery", "${formattedQuery} LIMIT 100"),
      set("rawPreview", bigquery("testQuery", {
        maxResults: 100,
        timeoutMs: 30000,
        query: "${finalQuery}",
        useLegacySql: false
      })),
      ifL(cond("isEmpty", "${rawPreview.error}"), {
        do: [
          set("retData.entries", jsonata("[$.rows.(\n" +
            "    $merge(\n" +
            "        $map($.f, function($v, $i) {\n" +
            "            {\n" +
            "                $$.schema.fields[$i].name: $v.v\n" +
            "            }\n" +
            "        })\n" +
            "    )\n" +
            ")]\n", "${rawPreview}")),
          set("retStatus", 200)
        ],
        eldo: [
          set("retStatus", "${rawPreview.error.status}"),
          set("retData.message", "${rawPreview.error.response.body.error.message}")
        ]
      })
    ], {
      status: "${retStatus}",
      data: "${retData}"
    }),
  manualImport: route("startImport", input("body.query"))
};

module.exports = glue;
