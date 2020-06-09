/* @flow */

const {
  ifL,
  route,
  cond,
  settings,
  set,
  Svc,
  hull,
  iterateL,
  settingsUpdate,
  ld,
  not,
  input,
  notFilter,
  get,
  filter,
  returnValue,
  jsonata
} = require("hull-connector-framework/src/purplefusion/language");

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
  unsubscribeFromError: [
    route("unsubscribe", jsonata(`$.{"body": {"url": url}}`, { "url": "${zap_url}" }))
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
                    $[$contains(entityType, /user$/)].$[$contains(action, "created")].{"is_new_user": true},
                    $[$contains(entityType, /user_event$/)].$[$contains(action, "created")].{"user_events": inputData.user_events},

                    $[$contains(entityType, /account$/)].$[$not($contains(action, "entered_segment"))].$[$not($contains(action, "left_segment"))].{"account_segments": inputData.account_segments},
                    $[$contains(entityType, /account$/)].$[($contains(action, "attribute_updated"))].{"account_attribute_updated": inputData.account_attributes},
                    $[$contains(entityType, /account$/)].$[$contains(action, "entered_segment")].{"entered_account_segments": inputData.account_segments},
                    $[$contains(entityType, /account$/)].$[$contains(action, "left_segment")].{"left_account_segments": inputData.account_segments},
                    $[$contains(entityType, /account$/)].$[$contains(action, "created")].{"is_new_account": true}
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
