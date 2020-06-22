const debug = require("debug")("hull-connector:on-exit");

/**
 * @param {Promise} promise
 */
function onExit(promise) {
  function exitNow() {
    setTimeout(() => {
      console.warn("connector.exitHandler.exitNow");
      process.exit(0);
    }, 100000);
  }

  function handleExit() {
    const waiting = 30000;
    debug("connector.exitHandler.handleExit", { waiting });
    // setTimeout(exitNow, waiting);
    console.log(`SIGINT Handling Exit: ${Date.now()}`);
    promise().then(exitNow, exitNow);
  }

  function handleExit2() {
    // const waiting = 30000;
    // debug("connector.exitHandler.handleExit", { waiting });
    // setTimeout(exitNow, waiting);
    console.log(`SIGTERM Handling Exit: ${Date.now()}`);
    promise().then(exitNow, exitNow);
  }

  function handleExit3() {
    // const waiting = 30000;
    // debug("connector.exitHandler.handleExit", { waiting });
    // setTimeout(exitNow, waiting);
    console.log(`gracefulExit Handling Exit: ${Date.now()}`);
    promise().then(exitNow, exitNow);
  }

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit2);
  process.on("gracefulExit", handleExit3);
}

module.exports = onExit;
