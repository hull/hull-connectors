/**
 * Still got some time before we can abstract out this far to have shared workflows..
 * But the idea is that if we defined particular endpoints on the service which
 * for example may not have upsert capability.  We can have shared patterns here for:
 * "Heres how to do upsert if that functionality isn't available..."
 *  -> check anon id, if so, lookup, else, lookup naturalkey, depending on outcome
 *  -> post or patch...
 */

const definitions = {
  accountLastSyncFetch:
    ifLogic(cond("isEmpty", "${connector.private_settings.lastSync}"), {
      true: hull("asAccount", svc("accountFetchAll"))
      false: [
        set("newLastSync", utils("now")),
        hull("settingsUpdate", { "lastSync": "${newLastSync}" }),
        svc("accountFetchByLastSync")
      ]
    }),
}

module.exports = {
  definitions
};
