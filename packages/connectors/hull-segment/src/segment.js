function segment() {
  window.analytics = window.analytics || [];
  const analytics = window.analytics;

  if (!analytics.initialize) {
    if (analytics.invoked) {
      window?.console?.error("Segment snippet included twice.");
    } else {
      analytics.invoked = !0;
      analytics.methods = [
        "trackSubmit",
        "trackClick",
        "trackLink",
        "trackForm",
        "pageview",
        "identify",
        "reset",
        "group",
        "track",
        "ready",
        "alias",
        "page",
        "once",
        "off",
        "on"
      ];
      analytics.factory = function analyticsFactory(t) {
        return function anl(...args) {
          const e = Array.prototype.slice.call(args);
          e.unshift(t);
          analytics.push(e);
          return analytics;
        };
      };
      for (let t = 0; t < analytics.methods.length; t += 1) {
        const e = analytics.methods[t];
        analytics[e] = analytics.factory(e);
      }
      analytics.load = function anlLoad(t) {
        const e = document.createElement("script");
        e.type = "text/javascript";
        e.async = !0;
        e.src = `${
          document.location.protocol === "https:" ? "https://" : "http://"
        }cdn.segment.com/analytics.js/v1/${t}/analytics.min.js`;
        const n = document.getElementsByTagName("script")[0];
        n.parentNode.insertBefore(e, n);
      };
      window.analytics = analytics;
      analytics.SNIPPET_VERSION = "3.1.0";
    }
  }
}

module.exports = segment;
