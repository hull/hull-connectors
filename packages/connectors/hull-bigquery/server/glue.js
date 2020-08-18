const {
  ifL,
  cond,
  settings,
  settingsUpdate,
  set,
  ex,
  utils,
  moment,
  Svc
} = require("hull-connector-framework/src/purplefusion/language");

function bigquery(op: string, param?: any): Svc {
  return new Svc({ name: "bigquery", op }, param);
}

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  grant_type: "refresh_token"
};

const glue = {
  status: ifL([
    cond("notEmpty", settings("access_token")),
    cond("notEmpty", settings("refresh_token"))
  ], {
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
      message: "Connector not authenticated"
    }
  }),
  import: [],
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
};

module.exports = glue;
