/* @flow */

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
  inc,
  not,
  input,
  notFilter,
  get,
  or,
  cacheLock,
  cacheSet,
  cacheGet,
  filter,
  ex,
  returnValue,
  jsonata
} = require("hull-connector-framework/src/purplefusion/language");
const {
  ZapierUserRead,
  ZapierAccountRead
} = require("./service-objects");

const {
  HullOutgoingAccount,
  HullOutgoingUser,
  WebPayload
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const _ = require("lodash");

function zapier(op: string, param?: any): Svc {
  return new Svc({ name: "zapier", op }, param)
}

const glue = {
  userUpdate: [
    iterateL(input(), { key: "message", async: true }, [
      route("userUpdateStart", cast(HullOutgoingUser, "${message}"))
    ])
  ],
  accountUpdate: [
    iterateL(input(), { key: "message", async: true }, [
      route("accountUpdateStart", cast(HullOutgoingAccount, "${message}"))
    ])
  ],
  userUpdateStart: [
    route("filterUserMessage"),
    route("sendZaps")
  ],
  accountUpdateStart: [
    route("filterAccountMessage"),
    route("sendZaps")
  ],
  isValidateInputData: [
    /*
    validate input data:
    {
      user_entered_segment: [ "user_segments" ],
      user_left_segment: [ "user_segments" ],
      user_created: [ "user_segments" ],
      user_event_created: [ "user_segments", "account_segments", "user_event" ],
      user_attribute_updated: [ "user_segments", "account_segments", ("'user_attributes' AND/OR 'account_attributes'") ],
    }
     */
  ],
  isValidSegment: [
    ifL(not(cond("isEqual", "${zapAction}", "left_segment")), [
      ifL(cond("isEqual", 0, ld("size", ld("intersection", "${validationData}", "${segmentsIn}"))), [
        set("isValid", false),
      ])
    ]),
    ifL(cond("isEqual", "${zapAction}", "entered_segment"), [
      ifL(cond("isEqual", 0, ld("size", ld("intersection", "${validationData}", "${segmentsEntered}"))), [
        set("isValid", false),
      ])
    ]),
    ifL(cond("isEqual", "${zapAction}", "left_segment"), [
      ifL(cond("isEqual", 0, ld("size", ld("intersection", "${validationData}", "${segmentsLeft}"))), [
        set("isValid", false),
      ])
    ])
  ],
  isValidZap: returnValue([
      set("zapInputData", get("inputData", "${zap}")),
      set("zapAction", get("action", "${zap}")),
      set("validations", ld("keys", "${zapInputData}")),
      set("isValid", true),

      iterateL("${validations}", "validation", [

        set("validationData", get("${validation}", "${zapInputData}")),

        /*
        Trigger Validations:
            1) User Enters Segment
                -> User enters one or more of the whitelisted user segments
            2) User Leaves Segment
                -> User leaves one or more of the whitelisted user segments
            3) User Attribute Updated
                -> CONDITION 1:
                    -> User is IN one or more of the whitelisted user segments
                       AND
                    -> Account on the user is IN one or more of the whitelisted account segments
                -> AND CONDITION 2:
                    -> A whitelisted user attribute was updated
                       OR
                    -> A whitelisted account (on the user) attribute was updated
            4) User Event Created
                -> User is IN one or more of the whitelisted user segments
                   AND
                -> Account on the user is IN one or more of the whitelisted account segments (or 'all_segments' defined)
                   AND
                -> Event name matches an event on the user
            5) Account Enters Segment
                -> Account enters one or more of the whitelisted account segments
            6) Account Leaves Segment
                -> Account leaves one or more of the whitelisted user segments
            7) Account Attribute Update
                -> Account is IN one or more of the whitelisted user segments
                   AND
                -> A whitelisted account attribute was updated
            8) User is created
                -> A newly created user is IN one or more of the whitelisted user segments
            9) Account is created
                -> A newly created account is IN one or more of the whitelisted account segments
         */

        // Event Validation
        ifL(cond("isEqual", "${validation}", "user_event"), [
          ifL(cond("isEqual", 0, ld("size", ld("intersection", "${validationData}", "${userEvents}"))), [
            set("isValid", false),
          ])
        ]),

        // User Segment Validations
        ifL(cond("isEqual", "${validation}", "user_segments"), [

          set("segmentsIn", ld("concat", "all_segments", ld("map", input("segments"), "id"))),
          set("segmentsEntered", ld("map", ld("get", "${changes}", "segments.entered", []), "id")),
          set("segmentsLeft", ld("map", ld("get", "${changes}", "segments.left", []), "id")),

          ifL(not(ld("isEmpty", "${segmentsEntered}")), [
            set("segmentsEntered", ld("concat", "all_segments", "${segmentsEntered}"))
          ]),
          ifL(not(ld("isEmpty", "${segmentsLeft}")), [
            set("segmentsLeft", ld("concat", "all_segments", "${segmentsLeft}"))
          ]),

          route("isValidSegment")
        ]),

        // Account Segment Validations
        ifL(cond("isEqual", "${validation}", "account_segments"), [

          set("segmentsIn", ld("concat", "all_segments", ld("map", input("account_segments"), "id"))),
          set("segmentsEntered", ld("map", ld("get", "${changes}", "account_segments.entered", []), "id")),
          set("segmentsLeft", ld("map", ld("get", "${changes}", "account_segments.left", []), "id")),

          ifL(not(ld("isEmpty", "${segmentsEntered}")), [
            set("segmentsEntered", ld("concat", "all_segments", "${segmentsEntered}"))
          ]),
          ifL(not(ld("isEmpty", "${segmentsLeft}")), [
            set("segmentsLeft", ld("concat", "all_segments", "${segmentsLeft}"))
          ]),
          route("isValidSegment")
        ]),

        // User/Account Attribute Validations
        ifL(or([
            cond("isEqual", "${validation}", "user_attributes"),
            cond("isEqual", "${validation}", "account_attributes")
          ]), [
            set("zapUserAttributes", get("user_attributes", "${zapInputData}")),
            set("zapAccountAttributes", get("account_attributes", "${zapInputData}")),

            set("hasMatchingUserAttributeChange", cond("lessThan", 0, ld("size", ld("intersection", "${zapUserAttributes}", "${userChangedAttributes}")))),
            set("hasMatchingAccountAttributeChange", cond("lessThan", 0, ld("size", ld("intersection", "${zapAccountAttributes}", "${accountChangedAttributes}")))),

            ifL([not("${hasMatchingUserAttributeChange}"), not("${hasMatchingAccountAttributeChange}")], [
              set("isValid", false),
            ])
          ])
      ]),
    ],
    "${isValid}"
  ),
  filterZaps: [
    iterateL("${zaps}", "zap", [
      ifL(cond("isEqual", true, route("isValidZap")), [
        set("filteredZaps", ld("concat", "${filteredZaps}", "${zap}"))
      ])
    ])
  ],
  filterUserMessage: [
    set("entityType", "user"),
    set("zaps", []),
    set("filteredZaps", []),
    set("changes", input("changes")),

    set("userEvents", ld("map", input("events"), "event")),
    set("userChangedAttributes", ld("keys", ld("get", "${changes}", "user", {}))),
    set("accountChangedAttributes", ld("keys", ld("get", "${changes}", "account", {}))),

    set("isNewUser", ld("get", "${changes}", "is_new", false)),
    set("hasUserChanges", cond("lessThan", 0, ld("size", "${changes.user}"))),
    set("hasNewEvents", cond("lessThan", 0, ld("size", input("events")))),
    set("hasUserLeftSegmentChanges", cond("lessThan", 0, ld("size", ld("get", "${changes}", "segments.left", [])))),
    set("hasUserEnteredSegmentChanges", cond("lessThan", 0, ld("size", ld("get", "${changes}", "segments.entered", [])))),

    ifL("${isNewUser}", [
      set("zaps", filter({ entityType: "user", action: "created" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasUserChanges}", [
      set("zaps", filter({ entityType: "user", action: "attribute_updated" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasNewEvents}", [
      set("zaps", filter({ entityType: "user_event", action: "created" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasUserEnteredSegmentChanges}", [
      set("zaps", filter({ entityType: "user", action: "entered_segment" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasUserLeftSegmentChanges}", [
      set("zaps", filter({ entityType: "user", action: "left_segment" }, settings("subscriptions"))),
      route("filterZaps")
    ])
  ],
  filterAccountMessage: [
    set("entityType", "account"),
    set("zaps", []),
    set("filteredZaps", []),
    set("changes", input("changes")),

    set("accountChangedAttributes", ld("keys", ld("get", "${changes}", "account", {}))),

    set("isNewAccount", ld("get", "${changes}", "is_new", false)),
    set("hasAccountChanges", cond("lessThan", 0, ld("size", "${changes.account}"))),
    set("hasAccountLeftSegmentChanges", cond("lessThan", 0, ld("size", ld("get", "${changes}", "account_segments.left", [])))),
    set("hasAccountEnteredSegmentChanges", cond("lessThan", 0, ld("size", ld("get", "${changes}", "account_segments.entered", [])))),

    ifL("${isNewAccount}", [
      set("zaps", filter({ entityType: "account", action: "created" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasAccountChanges}", [
      set("zaps", filter({ entityType: "account", action: "attribute_updated" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasAccountEnteredSegmentChanges}", [
      set("zaps", filter({ entityType: "account", action: "entered_segment" }, settings("subscriptions"))),
      route("filterZaps")
    ]),
    ifL("${hasAccountLeftSegmentChanges}", [
      set("zaps", filter({ entityType: "account", action: "left_segment" }, settings("subscriptions"))),
      route("filterZaps")
    ])
  ],
  sendZaps: [
    iterateL("${filteredZaps}", { key: "zap", async: true }, [
      set("zap_url", "${zap.url}"),
      set("resp", zapier("sendZap", input()))
    ])
  ],
  unsubscribeFromError: [
    route("unsubscribe", jsonata(`$.{"body": {"url": url}}`, input("response.req")))
  ],
  credentials: returnValue([
    set("api_key", get("clientCredentialsEncryptedToken", input("context")))
  ], {
    status: 200,
    data: {
      url: "${api_key}"
    }
  }),
  subscriptionRegisteredInHull:
    filter({
      url: input("body.url")
    }, settings("subscriptions")),
  subscribe: returnValue([
      ifL(ld("isEmpty", route("subscriptionRegisteredInHull")), [
        settingsUpdate({
          subscriptions:
            ld("uniqBy", ld("concat", settings("subscriptions"), input("body")), "url")
        })
      ])], {
      data: {
        ok: true
      },
      status: 200
    }
  ),
  unsubscribe: returnValue([
      ifL(not(ld("isEmpty", route("subscriptionRegisteredInHull"))), [
        settingsUpdate({
          subscriptions:
            notFilter({ url: input("body.url") }, settings("subscriptions"))
        })
      ])], {
      data: {
        ok: true
      },
      status: 200
    }
  ),
  create: returnValue([
    set("entityType", input("body.entityType")),

    // TODO move to new transformation when it's ready
    ifL(cond("isEqual", "${entityType}", "account"), [
      hull("asAccount", jsonata(`$.{"ident": {"external_id": claims.external_id, "domain": claims.domain}, "attributes": attributes}`, input("body")))
    ]),
    ifL(cond("isEqual", "${entityType}", "user"), [
      hull("asUser", jsonata(`$.{"ident": {"external_id": claims.external_id, "email": claims.email}, "attributes": attributes}`, input("body")))
    ]),
    ifL(cond("isEqual", "${entityType}", "user_event"), [
      hull("asUser", jsonata(`{"ident":{"external_id": claims.external_id, "email": claims.email},"attributes": attributes, "events": [$merge({"eventName": event_name, "context": {"source": "zapier"}, "properties": properties})]}`, input("body")))
    ])
  ],{
    data: {
      ok: true
    },
    status: 200
  }),
  search: returnValue([
    set("entityClaims", input("body.claims")),
    set("transformedEntities", []),

    ifL(cond("isEqual", input("body.entityType"), "user"), [
      set("foundEntities", hull("getUser", "${entityClaims}")),
      set("transformedEntities", jsonata(`$.[{"user": user}, {"segments": segments}, {"account": account}, {"account_segments": account_segments}]`, "${foundEntities}"))
    ]),
    ifL(cond("isEqual", input("body.entityType"), "account"), [
      set("foundEntities", hull("getAccount", "${entityClaims}")),
      set("transformedEntities", jsonata(`$.[{"account": account}, {"account_segments": account_segments}]`, "${foundEntities}"))

    ]),
  ],{
    data: "${transformedEntities}",
    status: 200
  }),
  schema: returnValue([
      ifL(cond("isEqual", input("body.entityType"), "user_event"), [
        set("rawEntitySchema", hull("getUserEvents")),
        ifL(cond("isEqual", input("body.zapierSchema"), "fieldsSchema"), {
          do: [
            set("transformedSchema", jsonata(`[$.{"label": name, "key": name}]`, "${rawEntitySchema}"))
          ],
          eldo: [
            set("transformedSchema", jsonata(`[$.{"value": name, "label": name}]`, "${rawEntitySchema}"))
          ]
        })
      ]),
      ifL(cond("isEqual", input("body.entityType"), "user"), [
        set("rawEntitySchema", hull("getUserAttributes")),
        ifL(cond("isEqual", input("body.zapierSchema"), "fieldsSchema"), {
          do: [
            set("transformedSchema", jsonata(`[$[$not($contains(key, "account."))].{"label": $string("user." & $replace(key, "traits_", "")), "key": $string("user__" & $replace(key, "traits_", ""))}]`, "${rawEntitySchema}"))
          ],
          eldo: [
            set("transformedSchema", jsonata(`[$[$not($contains(key, "account."))].{"value": $replace(key, "traits_", ""), "label": $replace(key, "traits_", "")}]`, "${rawEntitySchema}"))
          ]
        })
      ]),
      ifL(cond("isEqual", input("body.entityType"), "account"), [
        set("rawEntitySchema", hull("getAccountAttributes")),
        ifL(cond("isEqual", input("body.zapierSchema"), "fieldsSchema"), {
          do: [
            set("transformedSchema", jsonata(`[$.{"label": $string("account." & $replace(key, "traits_", "")), "key": $string("account__" & $replace(key, "traits_", ""))}]`, "${rawEntitySchema}"))
          ],
          eldo: [
            set("transformedSchema", jsonata(`[$.{"value": $replace(key, "traits_", ""), "label": $replace(key, "traits_", "")}]`, "${rawEntitySchema}"))
          ]
        })
      ]),
    ],{
      data: "${transformedSchema}",
      status: 200
    }
  ),
  auth: {
    data: {
      ok: true
    },
    status: 200
  },
  segments: returnValue([
      set("entityType", input("body.entityType")),
      ifL(cond("isEqual", input("body.entityType"), "account"), {
        do: [
          set("rawEntitySegments", hull("getAccountSegments"))
        ],
        eldo: [
          set("rawEntitySegments", hull("getUserSegments"))
        ]
      }),
      ifL(cond("notEmpty", "${rawEntitySegments}"), [
        set("entitySegments", jsonata(`[$.{"value": id, "label": name}]`, "${rawEntitySegments}"))
      ])
    ],
    {
      data: "${entitySegments}",
      status: 200
    }
  )
};

module.exports = glue;
