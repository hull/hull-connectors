import { notifHandler } from "hull/lib/utils";
import _ from "lodash";
import Bottleneck from "bottleneck";
import Clearbit from "../clearbit";

const Limiter = new Bottleneck.Group({
  maxConcurrent: 3,
  minTime: 250
});

const printLimits = _.throttle(() => {
  Limiter.limiters().map(({ limiter }) => {
    const nbRunning = limiter.running();
    const nbQueued = limiter.queued();
    if (nbRunning || nbQueued) {
      // eslint-disable-next-line no-console
      console.warn(
        "Limiter",
        JSON.stringify({
          nbRunning,
          nbQueued
        })
      );
    }
    return true;
  });
}, 1000);

setInterval(printLimits, 5000);

function handleBatchUpdate({ hostSecret }) {
  return ({ metric, client, ship, hostname }, messages = []) => {
    const limiter = Limiter.key(ship.id);

    // TODO: Fix
    const msg = messages
      .map(m => ({
        account: m.user.account,
        ...messages
      }))
      .filter(m => m.user.email);

    if (msg.length === 0) {
      return false;
    }

    const clearbit = new Clearbit({
      hull: client,
      ship,
      hostSecret,
      stream: false,
      metric: metric.increment,
      hostname
    });

    const handleMessage = (message, done) => {
      if (clearbit.canReveal(message)) {
        clearbit.reveal(message);
      } else if (clearbit.canEnrich(message)) {
        clearbit.enrich(message);
      }
      done(message);
    };

    return msg.map(message =>
      limiter.submit(handleMessage, message, () => {
        // DO NOT REMOVE THIS CALLBACK
        printLimits();
      })
    );
  };
}

export default function batchHandlerFactory(options) {
  return notifHandler({
    hostSecret: options.hostSecret,
    userHandlerOptions: {
      groupTraits: false,
      maxSize: 100,
      maxTime: 120
    },
    handlers: {
      "user:update": handleBatchUpdate(options)
    }
  });
}
