// global Hull

// Not implemented yet: GTag
// window.dataLayer = window.dataLayer || [];
// function gtag(){dataLayer.push(arguments);}
// gtag('js', new Date());
// gtag('config', 'UA-34606920-14');

import loadGA from "./lib/load-ga";

// Only supports analytics.js. GTM is a different thing
const start = (element, deployment, hull) => {
  // let user_id;
  const { ship = {} } = deployment;
  const { settings = {} } = ship;
  const { tid /* , uid */ } = settings;

  // Load GA for customer if we don't have it in the page.
  if (!window.ga) {
    loadGA();
  }
  const ga = window.ga;
  ga("create", tid, "auto");
  ga("send", "pageview");

  // Perform alias when GA is initialized.
  ga(tracker => {
    const cid = tracker.get("clientId");
    if (!cid) {
      return;
    }
    hull.alias(`ga:${cid}`);
  });

  // Not used
  // Update GA user ID if it changed
  // const sendUserId = attributes => {
  //   if (!uid) {
  //     return;
  //   }
  //   const old_user_id = user_id;
  //   user_id =
  //     uid === "external_id" ? attributes[uid] : hull.config().anonymous_id;
  //   if (user_id === old_user_id) {
  //     return;
  //   }
  //   ga("set", "userId", user_id);
  //   ga("send", "event", "authentication", "user-id available");
  // };
  //
  // // Send at boot time
  // sendUserId(hull.currentUser(), uid);
  // if (uid) {
  //   // Send whenever external_id changes
  //   hull.on("hull.traits", attributes => {
  //     sendUserId(attributes, uid);
  //   });
  // }

  // if (hull_to_ga) { hull.on("hull.track", ({ event, _params }) => { ga.send("send", "event", event); }); }
};

window.Hull.onEmbed(start);
