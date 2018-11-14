/**
 * Still got some time before we can abstract out this far to have shared workflows..
 * But the idea is that if we defined particular endpoints on the service which
 * for example may not have upsert capability.  We can have shared patterns here for:
 * "Heres how to do upsert if that functionality isn't available..."
 *  -> check anon id, if so, lookup, else, lookup naturalkey, depending on outcome
 *  -> post or patch...
 */

const definitions = {
  accountLastSyncFetch: [
    set("lastsync", "${connector.private_settings.lastSync}"),
    "accountFetch"
  ],
  accountFetch: {
    if: cond("NonEmpty", "${lastsync}"),
    true: [hull("settingsUpdate", { "connector.private_settings.lastSync": "${NOW}" }), "accountFetchAll" ],
    false: "accountFetchByLastSync"
  },
  accountFetchAll: hull(svc("endpointType:getAll")),
  accountFetchByLastSync: hull(svc("endpointType:byLastSync"))
}

module.exports = {
  definitions
};
