// @flow

import SuperagentThrottle from "superagent-throttle";

export default function throttleFactory() {
  const throttlePool = {};
  return function getThrottle({
    id,
    options,
    reset = false
  }: {
    id: string,
    options: any,
    reset?: boolean
  }): any {
    const throttle =
      (!reset && throttlePool[id]) || new SuperagentThrottle(options);
    throttlePool[id] = throttle;
    return throttle;
  };
}
