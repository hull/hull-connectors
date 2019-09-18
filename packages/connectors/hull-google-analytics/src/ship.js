// global Hull
// window.dataLayer = window.dataLayer || [];
// function gtag(){dataLayer.push(arguments);}
// gtag('js', new Date());
// gtag('config', 'UA-34606920-14');

const loadGA = () => {
  (function(i, s, o, g, r, a, m) {
    i.GoogleAnalyticsObject = r;
    (i[r] =
      i[r] ||
      function() {
        (i[r].q = i[r].q || []).push(arguments);
      }),
      (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(
    window,
    document,
    "script",
    "https://www.google-analytics.com/analytics.js",
    "ga"
  );
};
const start = (element, deployment, hull) => {
  const { ship = {} } = deployment;
  const { settings = {} } = ship;
  const { tid } = settings;
  debugger
  if (!window.ga) {
    loadGA();
  }
  window.ga("create", tid, "auto");
  window.ga("send", "pageview");
  window.ga(tracker => {
    const cid = tracker.get("clientId");
    debugger;
    if (cid) {
      hull.alias(`ga:${cid}`);
    }
  });
};

Hull.onEmbed(start);
