// @flow
import type { HullContext } from "hull";

const shipUpdate = (getThrottle: Function) => (ctx: HullContext) => {
  const { connector, clientCredentials } = ctx;
  const { id } = clientCredentials;
  const { private_settings = {} } = connector;
  const { throttle_rate, throttle_per_rate, concurrency } = private_settings;
  // the `reset` option ensures our throttle is reset whenever we have some changes in the Settings.
  getThrottle({
    id,
    options: {
      rate: throttle_rate,
      ratePer: throttle_per_rate,
      concurrent: concurrency
    },
    reset: true
  });
};

export default shipUpdate;
