/* @flow */

const {
  lockL,
  cacheGet,
  cacheSet,
  ifL,
  route,
  cond,
  hull,
  get,
  set,
  iterateL,
  input,
  Svc,
  settings,
  obj,
  cast,
  ld,
  utils,
  transformTo,
  ex,
  settingsUpdate,
  moment
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullOutgoingAccount,
  HullOutgoingUser
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const _ = require("lodash");
const { SQLUserWrite, SQLAccountWrite } = require("./service-objects");

function sqlJdbc(op: string, param?: any): Svc {
  return new Svc({ name: "sql", op }, param);
}

const glue = {
  status: ifL(
    [
      cond("isEmpty", settings("db_username")),
      cond("isEmpty", settings("db_password")),
      cond("isEmpty", settings("db_hostname")),
      cond("isEmpty", settings("db_port")),
      cond("isEmpty", settings("db_name"))
    ],
    {
      do: {
        status: "setupRequired",
        message:
          "The required fields are not filled out in your connector settings.  Please go to the connector settings and review the configured fields"
      },
      eldo: [
        ifL(cond("isEmpty", settings("db_hostname")), {
          status: "setupRequired",
          message:
            "Please specify hostname in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_port")), {
          status: "setupRequired",
          message:
            "Please specify port in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_name")), {
          status: "setupRequired",
          message:
            "Please specify database name in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_username")), {
          status: "setupRequired",
          message:
            "Please specify username in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_password")), {
          status: "setupRequired",
          message:
            "Please specify password in the settings as it is a required field"
        }),
        ifL(
          route("hasRequiredFields"),
          ifL(
            cond(
              "notEmpty",
              set(
                "errorMessage",
                get("errorMessage", sqlJdbc("databaseConnectionSuccess"))
              )
            ),
            {
              status: "error",
              message: "Unable to connect to your database: (${errorMessage})"
            }
          )
        )
      ]
    }
  ),
  hasRequiredFields: cond("allTrue", [
    cond("notEmpty", settings("db_username")),
    cond("notEmpty", settings("db_password")),
    cond("notEmpty", settings("db_hostname")),
    cond("notEmpty", settings("db_port")),
    cond("notEmpty", settings("db_name"))
  ]),
  buildBatchObject: sqlJdbc("buildBatchObject", input()),
  accountUpdate: ifL(
    route("hasRequiredFields"),
    iterateL(input(), { key: "message", async: true }, [
      ifL(
        [
          cond("isEqual", "${isBatch}", true),
          cond("isEqual", settings("send_all_account_attributes"), true),
          cond("isEqual", settings("send_null"), true)
        ],
        [
          ifL(
            cond("isEmpty", "${accountAttributes}"),
            set("accountAttributes", cacheGet("accountAttributes"))
          ),
          ifL(cond("isEmpty", "${accountAttributes}"), [
            set("accountAttributes", hull("getAccountAttributes")),
            cacheSet(
              { key: "accountAttributes", ttl: 99999999 },
              "${accountAttributes}"
            )
          ]),
          ld(
            "set",
            "${message}",
            "account",
            route("buildBatchObject", {
              message: "${message}",
              attributes: "${accountAttributes}",
              entity: "account"
            })
          )
        ]
      ),

      sqlJdbc("upsertHullAccount", cast(HullOutgoingAccount, "${message}"))
    ])
  ),
  userUpdate: ifL(
    route("hasRequiredFields"),
    iterateL(input(), { key: "message", async: true }, [
      ifL(
        [
          cond("isEqual", "${isBatch}", true),
          cond("isEqual", settings("send_all_user_attributes"), true),
          cond("isEqual", settings("send_null"), true)
        ],
        [
          ifL(
            cond("isEmpty", "${userAttributes}"),
            set("userAttributes", cacheGet("userAttributes"))
          ),
          ifL(cond("isEmpty", "${userAttributes}"), [
            set("userAttributes", hull("getUserAttributes")),
            cacheSet(
              { key: "userAttributes", ttl: 99999999 },
              "${userAttributes}"
            )
          ]),
          ld(
            "set",
            "${message}",
            "user",
            route("buildBatchObject", {
              message: "${message}",
              attributes: "${userAttributes}",
              entity: "user"
            })
          )
        ]
      ),

      sqlJdbc("upsertHullUser", cast(HullOutgoingUser, "${message}")),

      iterateL(
        ld("filter", "${message.events}", { event_type: "user_merged" }),
        "event",
        sqlJdbc("mergeHullUser", {
          previous: "${event.properties.merged_id}",
          merged: "${event.user_id}"
        })
      )
    ])
  ),
  ensureHook: ifL(route("hasRequiredFields"), [
    ifL(
      cond(
        "isEqual",
        "${connector.private_settings.send_all_user_attributes}",
        false
      ),
      set(
        "userAttributesHash",
        utils("hashObject", settings("outgoing_user_attributes"))
      )
    ),
    ifL(
      cond(
        "isEqual",
        "${connector.private_settings.send_all_account_attributes}",
        false
      ),
      set(
        "accountAttributesHash",
        utils("hashObject", settings("outgoing_account_attributes"))
      )
    ),
    set(
      "currentDatabaseSettings",
      "${connector.private_settings.db_username}|" +
        "${connector.private_settings.db_password}|" +
        "${connector.private_settings.db_hostname}|" +
        "${connector.private_settings.db_port}|" +
        "${connector.private_settings.db_name}|" +
        "${connector.private_settings.db_account_table_name}|" +
        "${connector.private_settings.db_user_table_name}|" +
        "${connector.private_settings.db_events_table_name}|" +
        "${connector.private_settings.send_all_user_attributes}|" +
        "${connector.private_settings.send_all_account_attributes}|" +
        "${userAttributesHash}|" +
        "${accountAttributesHash}"
    ),

    // This condition checks for both if the databaseUrl has been set or if it's not equal to the existing one
    // in either case have to schema update both account and user and set the databaseUrl
    ifL(
      cond(
        "not",
        cond(
          "isEqual",
          "${currentDatabaseSettings}",
          cacheGet("databaseSettings")
        )
      ),
      {
        do: lockL("${connector.id}", [
          // need to invalidate the url in cases where we cleared the database
          // but the schema update fails, then we change the url back to previous
          // in bad state, still need to initialize
          cacheSet("databaseSettings", "invalid"),
          sqlJdbc("closeDatabaseConnectionIfExists"),
          route("accountSchemaUpdateStart"),
          route("userSchemaUpdateStart"),
          cacheSet(
            { key: "databaseSettings", ttl: 3600 },
            "${currentDatabaseSettings}"
          )
        ]),
        elif: [
          ifL(
            [
              // only check if "containsNewAttribute" if we're sending everything
              // otherwise, it wouldn't make sense to check because if we were selecting the attributes we know it's in the schema
              // and we would have gotten a ship:update if the outgoing attributes were changed, so would have resync'd anyway
              cond(
                "isEqual",
                "${connector.private_settings.send_all_user_attributes}",
                true
              ),
              cond("notEmpty", input("[0].user")),
              sqlJdbc("containsNewAttribute", {
                messages: obj(input()),
                schema: cacheGet("userSchema"),
                path: "user"
              })
            ],
            lockL("${connector.id}", route("userSchemaUpdateStart"))
          ),
          ifL(
            [
              cond(
                "isEqual",
                "${connector.private_settings.send_all_account_attributes}",
                true
              ),
              cond("notEmpty", input("[0].account")),
              sqlJdbc("containsNewAttribute", {
                messages: obj(input()),
                schema: cacheGet("accountSchema"),
                path: "account"
              })
            ],
            lockL("${connector.id}", route("accountSchemaUpdateStart"))
          )
        ]
      }
    )
  ]),
  accountSchemaUpdateStart: [
    cacheSet(
      { key: "accountSchema", ttl: 99999999 },
      sqlJdbc("createAccountSchema", hull("getAccountAttributes"))
    ),
    sqlJdbc("initSchema", {
      schema: cacheGet("accountSchema"),
      tableName: settings("db_account_table_name")
    }),
    sqlJdbc("syncTableSchema", settings("db_account_table_name"))
  ],
  userSchemaUpdateStart: [
    cacheSet(
      { key: "userSchema", ttl: 99999999 },
      sqlJdbc("createUserSchema", hull("getUserAttributes"))
    ),
    sqlJdbc("initSchema", {
      schema: cacheGet("userSchema"),
      tableName: settings("db_user_table_name")
    }),
    sqlJdbc("syncTableSchema", settings("db_user_table_name")),

    sqlJdbc("initSchema", {
      schema: sqlJdbc("createEventSchema"),
      tableName: settings("db_events_table_name"),
      indexes: sqlJdbc("createEventIndexes")
    }),
    ifL(cond("isEmpty", settings("event_table_synced_at")), [
      sqlJdbc("syncTableSchema", settings("db_events_table_name")),
      settingsUpdate({ event_table_synced_at: ex(moment(), "valueOf") })
    ])
  ],
  // currently need to do this so ship:update doesn't fail, but ensure hook will see if we really need to reinit
  shipUpdate: {}
};

module.exports = glue;
