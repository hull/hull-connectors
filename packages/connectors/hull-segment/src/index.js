// @noflow

/* global require, Hull*/

const segment = require("./segment");
const camelize = require("camelize");
segment();

function start(element, deployment, hull) {
  function getOptions() {
    const services = Hull.config("services.analytics") || {};
    const options = {
      anonymousId: hull.config("anonymousId") || hull.config("browserId")
    };

    if (services && services.intercom && services.intercom.credentials) {
      options.integrations = {
        Intercom: { user_hash: services.intercom.credentials.user_hash },
        Hull: {
          id: true
        }
      };
    }

    return options;
  }

  if (window.analytics) {
    window.analytics.load(deployment.ship.settings.write_key);
    window.analytics.page();
  }

  function identify(me) {
    if (window.analytics && me && me.id) {
      const user = ["name", "email", "username"].reduce((u, k) => {
        if (me[k] != null) {
          u[k] = me[k];
        }
        return u;
      }, {});
    }
  }

  function track(payload) {
    if (window.analytics && payload) {
      window.analytics.track(payload.event, payload.params, getOptions());
    }
  }

  function traits(payload) {
    if (window.analytics && payload) {
      window.analytics.identify(camelize(payload), getOptions());
    }
  }

  Hull.on("hull.track", track);
  Hull.on("hull.traits", traits);
  Hull.on("hull.user.*", identify);
  identify(hull.currentUser());
  Hull.on("hull.user.logout", () => {
    window.analytics && window.analytics.reset();
  });
}

Hull.onEmbed(start);
