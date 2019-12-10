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

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const _ = require("lodash");

function zapier(op: string, param?: any): Svc {
  return new Svc({ name: "zapier", op }, param)
}

const glue = {
  userUpdate: [],
  accountUpdate: [],
  performTrigger: [
    iterateL(input(), { key: "message", async: true }, [
      set("outgoingEntity", get("cleanedEntity", "${message}")),
      route("sendZaps", {
        webhook: "${message.serviceAction.webhook}",
        data: "${outgoingEntity}"
      })
    ])
  ],
  sendZaps: [
    set("zap_url", input("webhook")),
    zapier("sendZap", input("data"))
  ],
  filterZaps: returnValue([
    set("filteredZaps", []),
    iterateL(input("zaps"), "zap", [
      ifL(cond("isEqual", true, route("isValidZap", {
        zap: "${zap}",
        data: input("data")
      })), [
        set("filteredZaps", ld("concat", "${filteredZaps}", "${zap}"))
      ])
    ])
  ], "${filteredZaps}"),
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
      set("entity", input("data")),
      set("isValid", true),

      // Entity Data
      set("changes", ld("get", "${entity}", "changes", {})),

      // User Data
      set("segments", ld("get", "${entity}", "segments", {})),
      set("userChangedAttributes", ld("keys", ld("get", "${changes}", "user", {}))),
      set("userEvents", ld("map", ld("get", "${entity}", "events", []), "event")),

      // Account Data
      set("account_segments", ld("get", "${entity}", "account_segments", {})),
      set("accountChangedAttributes", ld("keys", ld("get", "${changes}", "account", {}))),

      // Zap Data
      set("zapInputData", get("inputData", input("zap"))),
      set("zapAction", get("action", input("zap"))),
      set("validations", ld("keys", "${zapInputData}")),

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
                -> Account leaves one or more of the whitelisted account segments
            7) Account Attribute Update
                -> Account is IN one or more of the whitelisted account segments
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

          set("segmentsIn", ld("concat", "all_segments", ld("map", "${segments}", "id"))),
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

          set("segmentsIn", ld("concat", "all_segments", ld("map", "${account_segments}", "id"))),
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
      serviceAction: { webhook: input("url") }
    }, settings("triggers")),
  subscribe: returnValue([
      ifL(ld("isEmpty", route("subscriptionRegisteredInHull", { url: input("body.url") })), [

        // TODO terrible. move over to new transformation layer
        set("transformedTrigger", jsonata(`
          $merge([
              {"serviceAction": {"webhook": url}},
              {
                "inputData":
                  $merge([
                    $[$contains(entityType, /user/)].$[$not($contains(action, "entered_segment"))].$[$not($contains(action, "left_segment"))].{"user_segments": inputData.user_segments},
                    $[$contains(entityType, /user/)].$[$not($contains(action, "entered_segment"))].$[$not($contains(action, "left_segment"))].{"account_segments": inputData.account_segments},
                    $[$contains(entityType, /user$/)].$[($contains(action, "attribute_updated"))].{"account_attribute_updated": inputData.account_attributes},
                    $[$contains(entityType, /user$/)].$[($contains(action, "attribute_updated"))].{"user_attribute_updated": inputData.user_attributes},
                    $[$contains(entityType, /user$/)].$[$contains(action, "entered_segment")].{"entered_user_segments": inputData.user_segments},
                    $[$contains(entityType, /user$/)].$[$contains(action, "left_segment")].{"left_user_segments": inputData.user_segments},
                    $[$contains(entityType, /user$/)].$[$contains(action, "created")].{"is_new": true},
                    $[$contains(entityType, /user_event$/)].$[$contains(action, "created")].{"user_events": inputData.user_events},

                    $[$contains(entityType, /account$/)].$[$not($contains(action, "entered_segment"))].$[$not($contains(action, "left_segment"))].{"account_segments": inputData.account_segments},
                    $[$contains(entityType, /account$/)].$[($contains(action, "attribute_updated"))].{"account_attribute_updated": inputData.account_attributes},
                    $[$contains(entityType, /account$/)].$[$contains(action, "entered_segment")].{"entered_account_segments": inputData.account_segments},
                    $[$contains(entityType, /account$/)].$[$contains(action, "left_segment")].{"left_account_segments": inputData.account_segments},
                    $[$contains(entityType, /account$/)].$[$contains(action, "created")].{"is_new": true}
                   ])
              }
          ])`, input("body"))),
        settingsUpdate({
          triggers:
            ld("uniqBy", ld("concat", settings("triggers"), "${transformedTrigger}"), "serviceAction.webhook")
        })
      ])], {
      data: {
        ok: true
      },
      status: 200
    }
  ),
  unsubscribe: returnValue([
      ifL(not(ld("isEmpty", route("subscriptionRegisteredInHull", { url: input("body.url") }))), [
        settingsUpdate({
          triggers:
            notFilter({ serviceAction: { webhook: input("body.url") } }, settings("triggers"))
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
        set("transformedSchema", jsonata(`[$.{"name": $string("user_event." & name)}]`, "${rawEntitySchema}"))
      ]),
      ifL(cond("isEqual", input("body.entityType"), "user"), [
        set("rawEntitySchema", hull("getUserAttributes")),
        set("transformedSchema", jsonata(`[$[$not($contains(key, "account."))].{"name": $string("user." & $replace(key, "traits_", ""))}]`, "${rawEntitySchema}"))
      ]),
      ifL(cond("isEqual", input("body.entityType"), "account"), [
        set("rawEntitySchema", hull("getAccountAttributes")),
        set("transformedSchema", jsonata(`[$.{"name": $string("account." & $replace(key, "traits_", ""))}]`, "${rawEntitySchema}"))
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
