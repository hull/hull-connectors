// @flow
import _ from "lodash";
import ga from "./ga";
import gtm from "./gtm";
import type { PublicUpdate } from "../../types";

const DESTINATIONS = { ga, gtm };

export default function handleDestinations({ emitter }: { emitter: any }) {
  emitter.on("user.update", (update: PublicUpdate) => {
    const { destinations } = update;
    _.map(destinations, (destination, key) => {
      if (destination.enabled && DESTINATIONS[key]) {
        DESTINATIONS[key](destination, update);
      }
    });
  });
}
