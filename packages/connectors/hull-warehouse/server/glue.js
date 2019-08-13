/* @flow */

const {
  lockL,
  cacheGet,
  cacheSet,
  ifL,
  route,
  cond,
  hull,
  set,
  get,
  input,
  Svc,
  settings,
  obj
} = require("hull-connector-framework/src/purplefusion/language");

const _ = require("lodash");

function postgresJdbc(op: string, param?: any): Svc {
  return new Svc({ name: "postgres", op }, param);
}


const glue = {
  status: ifL([
      cond("isEmpty", settings("db_username")),
      cond("isEmpty", settings("db_password")),
      cond("isEmpty", settings("db_hostname")),
      cond("isEmpty", settings("db_port")),
      cond("isEmpty", settings("db_name"))
    ],
    {
      do: {
        status: "ok",
        message: "The required fields are not filled out in your connector settings.  Please go to the connector settings and review the configured fields"
      },
      eldo: [
        ifL(cond("isEmpty", settings("db_hostname")), {
          status: "ok",
          message: "Please specify hostname in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_port")), {
          status: "ok",
          message: "Please specify port in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_name")), {
          status: "ok",
          message: "Please specify database name in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_username")), {
          status: "ok",
          message: "Please specify username in the settings as it is a required field"
        }),
        ifL(cond("isEmpty", settings("db_password")), {
          status: "ok",
          message: "Please specify password in the settings as it is a required field"
        }),
        ifL(route("hasRequiredFields"),
          ifL(cond("notEmpty", set("errorMessage", get("errorMessage", postgresJdbc("databaseConnectionSuccess")))), {
            status: "error",
            message: "Unable to connect to your database: (${errorMessage})"
          })
        )
      ]
    }),
  hasRequiredFields: cond("allTrue", [
    cond("notEmpty", settings("db_username")),
    cond("notEmpty", settings("db_password")),
    cond("notEmpty", settings("db_hostname")),
    cond("notEmpty", settings("db_port")),
    cond("notEmpty", settings("db_name"))
  ]),

  accountUpdateStart: ifL(route("hasRequiredFields"), postgresJdbc("upsertHullAccount", input())),
  userUpdateStart: ifL(route("hasRequiredFields"), postgresJdbc("upsertHullUser", input())),

  ensureHook: ifL(route("hasRequiredFields"), [
    set("currentDatabaseSettings",
      "${connector.private_settings.db_username}|" +
      "${connector.private_settings.db_password}|" +
      "${connector.private_settings.db_hostname}|" +
      "${connector.private_settings.db_port}|" +
      "${connector.private_settings.db_name}|" +
      "${connector.private_settings.db_account_table_name}|" +
      "${connector.private_settings.db_user_table_name}|" +
      "${connector.private_settings.db_events_table_name}"),

    // This condition checks for both if the databaseUrl has been set or if it's not equal to the existing one
    // in either case have to schema update both account and user and set the databaseUrl
    ifL(cond("not", cond("isEqual", "${currentDatabaseSettings}", cacheGet("databaseSettings"))), {
      do: lockL("${connector.id}", [
        // need to invalidate the url in cases where we cleared the database
        // but the schema update fails, then we change the url back to previous
        // in bad state, still need to initialize
        cacheSet("databaseSettings", "invalid"),
        postgresJdbc("closeDatabaseConnectionIfExists"),
        route("accountSchemaUpdateStart"),
        route("userSchemaUpdateStart"),
        cacheSet({ key: "databaseSettings", ttl: 99999999 }, "${currentDatabaseSettings}")
      ]),
      elif: [
        ifL([
            cond("notEmpty", input("[0].user")),
            postgresJdbc("containsNewAttribute", {
              messages: obj(input()),
              schema: cacheGet("userSchema"),
              path: "user"
            }),
          ],
          lockL("${connector.id}", route("userSchemaUpdateStart"))
        ),
        ifL([
            cond("notEmpty", input("[0].account")),
            postgresJdbc("containsNewAttribute", {
              messages: obj(input()),
              schema: cacheGet("accountSchema"),
              path: "account"
            }),
          ],
          lockL("${connector.id}", route("accountSchemaUpdateStart"))
        )
      ]
    })
  ]),
  accountSchemaUpdateStart: [
    cacheSet({ key: "accountSchema", ttl: 99999999 }, postgresJdbc("createAccountSchema", hull("getAccountAttributes"))),
    postgresJdbc("initSchema", {
      schema: cacheGet("accountSchema"),
      tableName: settings("db_account_table_name")
    }),
    postgresJdbc("syncTableSchema", settings("db_account_table_name")),
  ],
  userSchemaUpdateStart: [
    cacheSet({ key: "userSchema", ttl: 99999999 }, postgresJdbc("createUserSchema", hull("getUserAttributes"))),
    postgresJdbc("initSchema", {
      schema: cacheGet("userSchema"),
      tableName: settings("db_user_table_name")
    }),
    postgresJdbc("syncTableSchema", settings("db_user_table_name")),

    postgresJdbc("initSchema", {
      schema: postgresJdbc("createEventSchema"),
      tableName: settings("db_events_table_name")
    }),
    postgresJdbc("syncTableSchema", settings("db_events_table_name"))
  ],
  // currently need to do this so ship:update doesn't fail, but ensure hook will see if we really need to reinit
  shipUpdateStart: {}
};

module.exports = glue;
