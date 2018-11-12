/* @flow */
const { service } = require("./service");

const {
  route,
  cond,
  hull,
  set,
  get,
  filter,
  updateSettings,
  Cond,
  Svc
} = require("./shared/language")

function outreachQuery(op: string, query: any): Svc { return new Svc("outreach", op, query, null)};
function outreachSend(op: string, data: any): Svc { return new Svc("outreach", op, null, data)};


// TODO need support for parallel paths too
// arrays of objects paths or just object
// Think about objects (class defs) vs pipes (type defs)
// Objects don't just define a shape, they're a specific type that must be translated
// where as pipes (transforms and endpoints) just define behaviors

const glue = {
  userUpdateStart: {
    if: { type: "conditional", op: "notEmpty", param: "user.anonymous_id" },
    true: route("prospectLookupById"),
    false: route("prospectLookupByEmail")
  },
  prospectLookupById: {
    if: { type: "conditional", name: "notEmpty", param: { type: "service", name: "outreach", op: "getProspect" } },
    true: { type: "service", name: "hull", param: { type: "service", name: "outreach", op: "updateProspect" } },
    false: route("prospectLookupByEmail")
  },
  prospectLookupByEmail: {
    if: {
      type: "conditional",
      name: "notEmpty",
      params: {
        type: "service",
        name: "outreach",
        op: "getProspect",
        params: "email=${user.email}"
        }
      },
    true: {
      type: "service",
      name: "hull",
      op: "asUser",
      params: {
        type: "service",
        name: "outreach",
        op: "updateUser"
      }
    },
    false: {
      type: "service",
      name: "hull",
      op: "asUser",
      params: {
        type: "service",
        name: "outreach",
        op: "insertUser"
      }
    }
  },
  accountUpdateStart: {
    if: new Cond("notEmpty", "account.anonymous_id"),
      true: {
        if: new Cond("notEmpty", new Svc("outreach", "getAccountById")),
        true: new Svc("hull", "asAccount", new Svc("outreach", "updateAccount")),
        false: route("accountLookupByDomain")
      },
      false: route("accountLookupByDomain")
  },
  accountLookupByDomain: {
    if: cond("notEmpty", outreachQuery("getAccountByProperty", "domain=${account.domain}")),
    true: hull("asAccount", outreachSend("endpointType:update", "account")),
    false: hull("asAccount", outreachSend("endpointType:create", "account"))
  },

  accountLastSyncFetch:
    [set("lastsync", "${connector.private_settings.lastSync}"), route("accountFetch")],
  accountFetch: {
    if: cond("notEmpty", "${lastsync}"),
    true: [updateSettings("lastSync", "${NOW}"), "accountFetchAll" ],
    false: route("accountFetchByLastSync")
  },
  accountFetchAll: hull("asAccount", outreachQuery("getAllAccounts")),
  accountFetchByLastSync: hull("asAccount", outreachQuery("endpointType:byProperty", "lastSync=${lastSync}")),

  prospectFetchAll: hull("asUser", outreachQuery("getAllProspects")),
  fetchAll: [route("accountFetchAll"), route("userFetchAll")],

  ensureWebhook: {
    if: cond("isEmpty", "${connector.private_settings.webhookId}"),
    true: [
    set("webhookUrl", "${utils.webhookUrl}"),
    {
      if: cond("isEmpty", filter(outreachQuery("getAllWebhooks"), ["webhook.attributes.url", "${webhookUrl}"])),
      true: {},
      false: updateSettings(["webhookId",
        get(
          outreachSend("insertWebhook", {
            data: {
              type: "webhook",
              attributes: {
                url: "${webhookUrl}"
              }
            }
          }), "id")])
    }]
  }

};

module.exports = { glue };
