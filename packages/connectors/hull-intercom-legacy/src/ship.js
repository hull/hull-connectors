/* global Hull */

(function onEmbedWrapper() {
  let check = 0;
  function getAnonymousId() {
    if (window.Intercom && window.Intercom("getVisitorId")) return window.Intercom("getVisitorId");
    return undefined;
  }

  function waitForAnonymousId(o) {
    check += 1;
    if (check < 20 && !getAnonymousId()) return setTimeout(() => waitForAnonymousId(o), 100);
    const aId = getAnonymousId();
    if (aId) return o(getAnonymousId());
    return undefined;
  }

  function track({ event, params }){
    window.Intercom && window.Intercom("trackEvent", event, params)
  }
  function identify(payload){
    window.Intercom && window.Intercom("update", payload)
  }

  if (window.Hull) {
    Hull.onEmbed(function onEmbed(rootNode, deployment, hull) {
      Hull.on('hull.track', track);
      Hull.on('hull.identify', identify);
      waitForAnonymousId(o =>
        hull.api({ path: "/me/alias" }, "post", { anonymous_id: `intercom:${o}` })
      );
    });
  }
}());
