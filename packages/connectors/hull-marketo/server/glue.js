/* @flow */

const {
  route,
  cond,
  hull,
  set,
  get,
  filter,
  notFilter,
  filterL,
  ifL,
  iterateL,
  loopL,
  loopEndL,
  input,
  Svc,
  settings,
  settingsUpdate,
  cacheWrap,
  cacheSet,
  cacheGet,
  cacheLock,
  transformTo,
  jsonata,
  ld,
  moment,
  ex,
  cast,
  utils,
  not,
  or
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { MarketoIncomingLeadActivity } = require("./service-objects");

function marketo(op: string, param?: any): Svc {
  return new Svc({ name: "marketo", op }, param);
}

const leadExportBody = {
  fields: "${fields}",
  filter: {
    createdAt: {
      startAt: "${startAt}",
      endAt: "${endAt}"
    }
  }
}

const glue = {
  // Simple status which will return setup required if we don't have credentials filled out
  // TODO need to make a call to marketo to confirm it works...
  status: ifL(route("isConfigured"), {
    do:[
      ifL(cond("isEmpty", settings("synchronized_user_segments")), {
      status: "ok",
      message: "No data will be sent from Hull to Marketo currently because there are no whitelisted segments configured.  Please visit the connector settings page and add segments to be sent to Marketo"
      }),
      ifL(set("totalcalls", get("[0].total", marketo("getStatsUsage"))), {
        status: "ok",
        message: "Connected to Marketo.  Have used ${totalcalls} calls to the api today."
      })
    ],
    eldo: {
      status: "setupRequired",
      message: "Please fill out the required credential fields for Hull to connect with Marketo.  You can find these fields by clicking \"Settings\" then scrolling to the \"Connect with Marketo\" section."
    }
  }),

  // Hmmmm this is configured logic seems to be a prerequisite to do anything
  // maybe the ensure route needs to call it automatically and stop it
  // that being said, it shouldn't stop it for "status" endpoint
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("marketo_client_id")),
    cond("notEmpty", settings("marketo_client_secret")),
    cond("notEmpty", settings("marketo_authorized_user")),
    cond("notEmpty", settings("marketo_identity_url"))
  ]),

  // gets new authentication token, called if we our access token is denied, and we need to get a new token
  getAuthenticationToken: ifL(route("isConfigured"), [
    set("newAccessToken", marketo("getAuthenticationToken")),
    settingsUpdate({
      access_token: "${newAccessToken.access_token}",
      expires_in: "${newAccessToken.expires_in}",
      scope: "${newAccessToken.scope}"
    })
  ]),

  // Sometimes fields can be in the thousands, so hit the refresh on a schedule, instead of pulling on demand
  refreshCustomAttributes: ifL(route("isConfigured"), cacheWrap(1200, marketo("describeLeads"))),
  attributesLeadsIncoming: ifL(route("isConfigured"), transformTo(HullIncomingDropdownOption, route("refreshCustomAttributes"))),
  attributesLeadsOutgoing: ifL(route("isConfigured"), transformTo(HullOutgoingDropdownOption, route("refreshCustomAttributes"))),

  // Setup marketo api from the configured values
  ensureSetup:
    ifL(route("isConfigured"), [
      set("marketoApiUrl", ld("replace", ld("trim", settings("marketo_identity_url")), /\/identity$/, "")),
      ifL(cond("isEmpty", settings("access_token")), route("getAuthenticationToken")),
      set("service_name", "marketo")
    ]),

  //don't do anything on ship update
  shipUpdate: {},

  //Incremental polling logic
  fetchRecentLeadActivity:
    ifL(route("isConfigured"), [

      // if no latestLeadSync, set it to be from one hour ago
      ifL(cond("isEmpty", set("latestLeadSyncMillis", settings("latestLeadSync"))), {
        do: set("latestLeadSync", ex(moment(), "subtract", 10, "minutes")),
        eldo: set("latestLeadSync", moment("${latestLeadSyncMillis}"))
      }),

      // set now to be one minute previous
      set("now", ex(moment(), "subtract", 1, "minutes")),

      // TODO add conditions for if fields is null and/or fetch_events is true
      set("latestLeadSyncFormatted", ex("${latestLeadSync}", "format")),
      set("nextPageToken", get("nextPageToken", marketo("getLatestLeadActivityPagingToken"))),
      set("fields", jsonata("$.service", settings("incoming_user_attributes"))),

      // call for activityTypeIdMap so that the transformation can transform the event names properly
      // could be vulnerable to cases when we add new event types, and it's still cached, but we receive the new value
      set("activityTypeIdMap", cacheWrap(6000, marketo("getActivityTypeEnum"))),
      route("pageThroughLeadActivity"),
      settingsUpdate({ latestLeadSync: ex("${now}", "valueOf") })
    ]),

  // TODO may want to lock this
  // we've gotten into situations where we're far enough behind that we hit the endpoint again
  // need to research if we need to update latestLeadSync logic, though it's just given a token that's a "from X"
  // so may need to update with the latest time that we pull or something...
  pageThroughLeadActivity:
    loopL([
      set("activityPage", marketo("getLatestLeadActivity")),

      // if the result is not empty then iterate over it
      ifL(cond("notEmpty", get("activityPage.result")),

        // iterate over each activity
        iterateL("${activityPage.result}", { key: "leadActivity", async: true },
          // if fetch_events is true, or activityTypeId === 13 (attribute update which we still want to bring in)
          ifL(or([
              cond("isEqual", settings("fetch_events"), true),
              cond("isEqual", "${leadActivity.activityTypeId}", 13)
            ]),
            hull("asUser", cast(MarketoIncomingLeadActivity, "${leadActivity}"))
          )
        ),
      ),

      // now check if there's more results and set the next page Token if needed
      ifL(get("activityPage.moreResult"), {
        do: set("nextPageToken", get("activityPage.nextPageToken")),
        eldo: loopEndL()
      })
    ]),

  // Not crazy about all of the variables we use in this method, but it works
  // will refactor when introducing specific variable input to service
  fetchAllLeads: ifL(route("isConfigured"), {
    do: [
      // get all fields to pull from export
      ifL(cond("isEqual", settings("fetch_all_attributes"), true), {
        do: set("fields", jsonata("$.rest.name", route("refreshCustomAttributes"))),
        eldo: set("fields", jsonata("[$.service]", settings("incoming_user_attributes")))
      }),


      // use this to fetch a particular time range
      // exportJobId logic needs to be fixed if only 1 job is created
      // set("filterBegin", ex(moment("2019-04-17T13:03:50.947"), "subtract", 30, "days")),
      // set("filterEnd", moment("2019-04-17T13:03:50.947")),
      // set("filterStop", moment()),

      // started to get lazy and add to the utils methods
      set("filterBegin", ex(moment(), "subtract", 30, "days")),
      set("filterEnd", moment()),
      set("filterStop", ex(moment(), "subtract", 3, "years")),
      set("exportJobs", utils("emptyArray")),

      // Before we start to queue up new jobs from the beginning
      // make sure we've cleared the old ones, so we don't fetch multiple times
      // maybe not, maybe setting jobids in cache is enough?
      route("cancelPendingLeadExports"),

      loopL([
        set("startAt", ex("${filterBegin}", "format")),
        set("endAt", ex("${filterEnd}", "format")),
        set("exportJob", marketo("exportLeads", leadExportBody)),
        ex("${exportJobs}", "push", "${exportJob}"),

        // check the end condition to see if we've looped back far enough
        // or decrement the filterBegin/End
        ifL(cond("lessThan", ex("${filterBegin}", "valueOf"), ex("${filterStop}", "valueOf")),
          {
            do: loopEndL(),
            eldo: [
              ex("${filterBegin}", "subtract", 30, "days"),
              ex("${filterEnd}", "subtract", 30, "days")
            ]
          })
      ]),

      //TODO haven't tested the new jsonata string, used to be: $.result.exportId
      // but if only 1 exportId, it won't return an array, this way it will....
      cacheSet("exportJobIds", jsonata("[$.result.exportId]", "${exportJobs}")),
      cacheSet("completedJobIds", utils("emptyArray"))

    ]
  }),

  cancelPendingLeadExports:
    iterateL(
      notFilter({ status: "Completed" }, notFilter({ status: "Cancelled" }, marketo("getLeadExportJobs"))),
      "job",
      [
        set("leadExportId", "${job.exportId}"),
        marketo("cancelLeadExportJob")
      ]),

  enqueueCurrentLeadExports: [
    set("existingJobs", marketo("getLeadExportJobs")),
    // This logic here is pretty tight, should try to find a way to help it look better
    ifL(cond("lessThan", ld("size", filter({ status: "Queued" }, "${existingJobs}")), 10),
      iterateL(cacheGet("exportJobIds"), "leadExportId",
        ifL(
          [
            // check if there is an export which is in "created" mode and not queued
            cond("notEmpty", filter({ exportId: "${leadExportId}", status: "Created" }, "${existingJobs}")),
            // marketo returns success: false if there are too many jobs queued, so stop after that
            // TODO confirm if this logic is still working now that we're catching this code 1029 and making it a skippable error
            // I think it should
            cond("not", get("success", marketo("enqueueLeadExportJob")))
          ],
          loopEndL()
        )
      )
    )
  ],

  // TODO Need streaming for export stream
  pollLeadExport: {},

  /**
   * Command for pulling file manually
   * curl https://788-LLU-475.mktorest.com/bulk/v1/leads/export/exportId/file.json -H "Authorization: Bearer token" -H "Accept: application/json" > marketoexport.csv
   * curl https://788-LLU-475.mktorest.com/bulk/v1/leads/export/e9b3b8d8-07d3-46ac-a388-e24bd24f5659/file.json -H "Authorization: Bearer bde051b7-fd8a-4753-a452-d5c1f3a6a6b8:sj" -H "Accept: application/json"
   */
  customPollLeadExport: [

    // this queues up any jobs that haven't been started
    route("enqueueCurrentLeadExports"),

    // look at the difference in outstanding export jobids and completed jobids
    iterateL(
      ld("difference", cacheGet("exportJobIds"), cacheGet("completedJobIds")),
      "exportId",
      // Make sure the exportId is not in the completed jobs
      // And Make sure the job is marked as "Completed"
      ifL([
          cond("not", ex(cacheGet("completedJobIds"), "includes", "${exportId}")),
          cond("notEmpty", filter({ exportId: "${exportId}", status: "Completed"}, marketo("getLeadExportJobs")))
        ],
        cacheLock("InitialUserImport-${connector.id}", [
          hull("asUserImport", marketo("streamLatestLeadExport")),
          // I don't like the following 3 instructions, seems too verbose....
          // maybe condense this into 1 helper method that only have one call?
          // Get/Add/Set - AddToList?
          set("latestCompletedJobs", cacheGet("completedJobIds")),
          ex("${latestCompletedJobs}", "push", "${exportId}"),
          cacheSet("completedJobIds", "${latestCompletedJobs}")
        ])
      )
    ),
    // TODO this will set pollLeadExportInterval every time if we don't have any jobs currently to export...
    ifL(cond("isEmpty", ld("difference", cacheGet("exportJobIds"), cacheGet("completedJobIds"))),
      settingsUpdate({ pollLeadExportInterval: null })
    )
  ],

  // TODO will need batch output, and parallel handling for update
  // need to decide if use a pure batch upload job with fields to dedup on
  // or do the deduping in code with a batch lookup
  // can only use 1 field for deduping... : lookupField
  // can't use array...
  // Works, but may need to make sure we add the claims to the incoming values too
  // because if not, this is so slow we have to do asynch true, which means, we don't get the value for each user that we're uploading
  // must get it on the other way around like hubspot...
  userUpdate: ifL(route("isConfigured"), [
    set("messages", input()),
    iterateL(settings("user_claims"), "user_claim",
      ifL(cond("notEmpty", "${messages}"), [
        marketo("upsertLeads", filterL(cond("notEmpty", get("message.user.${user_claim.service}")), "message", "${messages}")),
        set("messages", filterL(cond("isEmpty", get("message.user.${user_claim.service}")), "message", "${messages}"))
      ])
    ),
    // have to wrap this in an if block because otherwise, service engine will think we've sent a hull user back to hull
    // and log incoming.user.success, even though the array is empty, but it still detects the servicedata with class type
    ifL(cond("notEmpty", "${messages}"),
      hull("outgoingSkip", "${messages}")
    )
  ]),

  // This is going to be an interesting one to do right
  // using batch lookup points, and once you find something, filtering on the rest of the attributes
  // maybe use a batch() instruction to bring multiple messages together
  // TODO https://docs.jsonata.org/embedding-extending
  // can use this to input additional variables we can reference
  // and since jsonata variable syntax is: $varname, we can use `` to define the strings in transform code

  // potentially have to keep all the messages in an array on batch, because transforms need them all in an array instead of separate servicedatas
  // could, push them into the same array for transforms.... that means that anytime we do that, we lose the ability to track the individual message
  // which might be ok... now we have a trigger for losing the trackabilty
  // actually, if we know what the identity claims are, we can always find the messages again on natural key...
  // leadLookup: describeEndpoint({ batchExecution: true, on: "userUpdate", condition: [ "!sendMessage", cond("isNew")]}, [
  leadLookup: [
    set("remainingMessages", ld("clone", input())),

    iterateL(settings("user_claims"), "claim", [

      ifL(cond("isEmpty", "${remainingMessages}"), loopEndL()),

      // TODO need value/key on loopArrayLogic
      // use "iterate" and "loop" instructions
      iterateL("${update}", { key: "possibleLeads", value: "userId" }, [
        set("message", get("[0]", filter({ user: { id: "${userId}" } }, input()))),
        set("filteredLeads",
          // TODO this isn't going to work because same problem
          // where we don't evaluate non-array params right, we just variable replace, then that's all, don't resolve instructions
          // but maybe we want to do that....
          filter({ "${claim.service}": get("${message.user}", "${claim.hull}") }, "${possibleLeads}")
        ),
        ifL(cond("notEmpty", "${filteredLeads}"),
          set("update.${message.user.id}", "${filteredLeads}")
        )
      ]),

      // call to service and find based on values
      // might find another way so you don't have to have multiple sets like this...
      set("allExistingLeads",
        marketo("lookupLeadByProperty", {
          filterType: "${claim.service}",
          filterValues: ld("join", jsonata("$.user.${claims.hull}", "${remainingMessages}"))
        })
      ),

      // what if objects get evaluated as objects
      // options are only given in order to instructions?... but if variable options, is a problem...
      //different helper constructor?
      iterateL("${remainingMessages}", "message", [
        set("filteredLeads",
          filter({ "${claim.service}": get("${message.user}", "${claim.hull}") }, "${allExistingLeads}")
        ),
        ifL(cond("notEmpty", "${filteredLeads}"), [
          // would either set on the object? Or set in the context of the object?...
          // context of the obj would get complicated....
          // maybe not needed.... yet...
          // seemingly only difference would be in transform
          // where you'd either set input to be ${filteredLeads[0].id} or filteredLeads[0].id
          // where it would either be in the context of the service data (though multiple nested service datas are complicated)
          // or in the message itself....
          set({ obj: "${message}", key: "filteredLeads" }, "${filteredLeads}"),
          set("remainingMessages",
            filter({ user: "${message.user.id}" }, "${remainingMessages}")
          )
        ])
      ])
    ])
  ]
};

module.exports = glue;
