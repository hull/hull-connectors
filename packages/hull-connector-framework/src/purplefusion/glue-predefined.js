const _ = require("lodash");

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
  inc,
  moment,
  ex,
  cast,
  utils,
  not,
  or
} = require("./language");

/**
 * Fetch All Logic
 *
 * ALL: { sortbystaticdate, asc/desc, paging, filterbystaticdate }

 Page by id (sorted by created or id)
 -> great…

 Page by created date (sorted by created)
 -> dates vulnerable to page size being too small
 -> can overcome by using date as well as a page offset….
 -> then only vulnerable to total size that can scroll using an offset 10k?
 -> you never know where the page break is, so you have to do >=, can’t do > on the page boundary, because may miss
 -> which means you might pull duplicates if created_at is the same…

 Page by offset/page (sorted by created or id) -> maybe don’t need a sort?
 -> A lot of the time there’s a limit to the amount we can scroll using an offset

 Page by modified date (sorted by modified)
 -> dates vulnerable to page size being too small
 -> can overcome by using date as well as a page offset….
 -> then only vulnerable to total size that can scroll using an offset 10k?
 -> primarily vulnerable to objects getting updated while fetching, but should go to the top, so as long as sorted by asc you're good

 Also have the export endpoints, but those are all pretty custom…

 Incremental Updates
 *
 *
 -> in all cases, need to verify that the attributes that you are pulling that when they “change” it either fires a web hook or changes the updated_at field
 Not all fields are equal. Sometimes there will be limitations based on how they’ve implemented things in the backend.  Particularly things that are probably in a separate table like relationships… 
 Webhooks
 -> Make sure there’s an id to tie back to original user/account
 -> not all attributes are always included in web hook firing

 Incremental Poll: { sortbyupdateddate, asc/desc, paging, filterbyupdatedate }
 Fetch Since Last Modified
 -> Specialized endpoint which gets recent modifications
 -> Entity endpoint with ability to sort by “updated_at”
 -> if no ability to set "updated_since", but can only sort, then need to look at data set
-> if only asc -> need ability to "updated_since" if not dead
-> if only desc -> no updated_since need to look at dataset and stop when got to the last know timestamp

 Fetch All Endpoint, but looking at “updated_at”
 -> Sometimes you may not have any endpoint where you can sort by “updated_at”
 -> in this case, you can hit a “Fetch All” endpoint where you can inspect “updated_at” as you scroll through….
 -> may need to handle the case where as you scroll there could be later stuff which you’ve scrolled past
 -> so either need to hit users 2x where you can only use the timestamp which you started (but anything “after” that is bonus which is hit 2x)
 -> Or you look at a window where you “skip some stuff” even though it may be later updates
 */


/**
 * all
 * sorted_by_static_date: true
 * sortOrder: asc
 * filter_by_static_date: true
 * paging: true
 */
function fetchAllByStaticDateAscFilteredWithPaging({ serviceName, fetchEndpoint, incomingType, datePathOnEntity, hullCommand, pageSize, fetchBody }) {
  return [
    set("pageOffset", 1),
    set("pageSize", pageSize),
    set("datePathOnEntity", datePathOnEntity),
      loopL([

        set("page", new Svc({ name: serviceName, op: fetchEndpoint }, fetchBody)),

        iterateL("${page}", { key: "entity" }, hull(hullCommand, cast(incomingType, "${entity}"))),

        set("dateOffset", get(datePathOnEntity, ld("last", "${page}"))),

        // Instruction after this gets executed too... loopEndL is only returned once the thing is fully evaluated
        // should fix that and make loopEndL a first class citizen, used a lot...
        ifL(cond("lessThan", "${page.length}", pageSize), loopEndL()),

        // doing this if we know that the number of contacts on the same date_created is greater than the page size
        // will avoid loops
        ifL(cond("isEqual", get(datePathOnEntity, ld("first", "${page}")), get(datePathOnEntity, ld("last", "${page}"))), {
          do: set("pageOffset", inc("${pageOffset}")),
          eldo: set("pageOffset", 1)
        })
      ])
  ]
}


/**
 * Recent
 * sorted_by_update_date: true
 * sortOrder: asc
 * filter_by_update_date: true
 * paging: true
 */
function fetchRecentModifiedAscFilteredWithPaging({ serviceName, fetchEndpoint, incomingType, datePathOnEntity, pageSize, hullCommand, timeFormat, fetchBody }) {
  return cacheLock(fetchEndpoint, _.concat([
      set("datePathOnEntity", datePathOnEntity),
      set("dateOffset", settings(`last_${fetchEndpoint}`)),
      ifL(cond("isEmpty", "${dateOffset}"), set("dateOffset", ex(ex(moment(), "subtract", { hour: 1 }), timeFormat)))
    ],
    fetchAllByStaticDateAscFilteredWithPaging({ serviceName, fetchEndpoint, incomingType, datePathOnEntity, pageSize, hullCommand, fetchBody }),
    [
      settingsUpdate({[`last_${fetchEndpoint}`]: "${dateOffset}"}),
    ]
  ));
}

/**
 * Incremental
 * sorted_by_update_date: true
 * sortOrder: desc
 * filter_by_update_date: false
 * paging: true
 */
function fetchRecentModifiedDescWithPaging({ serviceName, fetchEndpoint, incomingType, datePathOnEntity, hullCommand, pageSize, timeFormat, fetchBody }) {
  return cacheLock(fetchEndpoint, [
    set("lastFetchedDate", settings(`last_${fetchEndpoint}`)),
    ifL(cond("isEmpty", "${lastFetchedDate}"), set("lastFetchedDate", ex(ex(moment(), "subtract", { hour: 1 }), timeFormat)))
    set("pageOffset", 1),
    set("pageSize", pageSize),
    set("datePathOnEntity", datePathOnEntity),
    loopL([

      set("page", new Svc({ name: serviceName, op: fetchEndpoint }, fetchBody)),

      ifL(cond("isEmpty", "${latestModifiedDate}"),
        set("latestModifiedDate", get(datePathOnEntity, ld("first", "${page}"))),
      ),

      iterateL("${page}", { key: "entity" },
        ifL(cond("lessThan", "${lastFetchedDate}", `\${entity.${datePathOnEntity}}`),
          hull(hullCommand, cast(incomingType, "${entity}"))
        )
      ),

      set("currentDateOffset", get(datePathOnEntity, ld("last", "${page}"))),
      ifL(cond("lessThan", "${currentDateOffset}", "${lastFetchedDate}"), loopEndL()),
      set("pageOffset", inc("${pageOffset}"))
    ]),
    settingsUpdate({[`last_${fetchEndpoint}`]: "${latestModifiedDate}"}),
  ])
}


/**
 * All
 * sorted_by_static_date: true
 * sortOrder: desc
 * sorted_by_static_date: true
 * paging: true
 */
function fetchAllDescWithFilterAndPaging({ serviceName, fetchEndpoint, incomingType, datePathOnEntity, hullCommand, pageSize }) {
  return cacheLock(fetchEndpoint, [
    set("pageOffset", 1),
    set("pageSize", pageSize),
    set("datePathOnEntity", datePathOnEntity),
    loopL([

      set("page", new Svc({ name: serviceName, op: fetchEndpoint })),

      iterateL("${page}", { key: "entity" }, hull(hullCommand, cast(incomingType, "${entity}"))),

      set("dateOffset", get(datePathOnEntity, ld("last", "${page}"))),

      ifL(cond("lessThan", "${page.length}", pageSize), loopEndL()),

      ifL(cond("isEqual", get(datePathOnEntity, ld("first", "${page}")), get(datePathOnEntity, ld("last", "${page}"))), {
        do: set("pageOffset", inc("${pageOffset}")),
        eldo: set("pageOffset", 1)
      })
    ])
  ])
}

module.exports = {
  fetchAllByStaticDateAscFilteredWithPaging,
  fetchRecentModifiedAscFilteredWithPaging,
  fetchRecentModifiedDescWithPaging,
  fetchAllDescWithFilterAndPaging
}
