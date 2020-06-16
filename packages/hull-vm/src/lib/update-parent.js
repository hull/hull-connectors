// @flow
import _ from "lodash";
import type { HullConnector } from "hull";

// flow type below marks every property as optional by spreading it, FYI.
const update = _.debounce((ship: { ...HullConnector }) => {
  if (window.parent) {
    window.parent.postMessage(
      JSON.stringify({
        from: "embedded-ship",
        action: "update",
        ship
      }),
      "*"
    );
  }
}, 1000);
export default update;
