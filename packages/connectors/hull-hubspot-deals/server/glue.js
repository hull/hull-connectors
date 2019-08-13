/* @flow */

const {
  route,
  cond,
  hull,
  set,
  utils,
  ifL,
  input,
  Svc,
  cacheSet,
  cacheGet,
  settingsUpdate,
  settings,
  cacheLock,
  or
} = require("hull-connector-framework/src/purplefusion/language");

function hubspot(op: string, param?: any): Svc {
  return new Svc({ name: "hubspot", op }, param);
}

const dealsAttributes = {
  options: require("./actions/fielddefs/deal-fielddefs")
};

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "",
  grant_type: "refresh_token"
};

const glue = {
  shipUpdateStart: {},
  userUpdateStart: [
    set("service_name", "hubspot_deal"),
    set("hullUserId", input("user.id")),
    route("upsertDeal")
  ],
  upsertDeal:
    cacheLock(input("user.id"),
      ifL(or([
          set("dealId", input("user.hubspot_deal/id")),
          set("dealId", cacheGet(input("user.id")))
        ]), {
          do: route("updateDeal"),
          eldo: route("insertDeal")
        }
      )
    ),

  updateDeal:
    ifL(cond("notEmpty", set("dealFromHubspot", hubspot("updateDeal", input()))),[
      ifL(set("companyId", input("user.${connector.private_settings.outgoing_user_associated_account_id}")),
        hubspot("updateDealCompanyAssociation", {
          fromObjectId: "${dealId}",
          toObjectId: "${companyId}",
          category: "HUBSPOT_DEFINED",
          definitionId: 5
        })
      ),
      hull("asUser", "${dealFromHubspot}")
    ]),

  insertDeal:
    ifL(cond("notEmpty", set("dealFromHubspot", hubspot("insertDeal", input()))), [
      cacheSet({ key: input("user.id") }, "${dealFromHubspot.data.dealId}"),
      hull("asUser", "${dealFromHubspot}")
    ]),

  refreshToken:
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      set("connectorHostname", utils("getConnectorHostname")),
      ifL(cond("notEmpty", set("refreshTokenResponse", hubspot("refreshToken", refreshTokenDataTemplate))),
        settingsUpdate({
          expires_in: "${refreshTokenResponse.expires_in}",
          created_at: "${refreshTokenResponse.created_at}",
          refresh_token: "${refreshTokenResponse.refresh_token}",
          access_token: "${refreshTokenResponse.access_token}"
        })
      )
    ]),
  fieldsDealOut: dealsAttributes
};

module.exports = glue;
