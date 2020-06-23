const debug = require("debug")("hull-connector:on-exit");

/**
 * @param {Promise} promise
 */
function onExit(promise) {
  function exitImmediately() {
    console.log(`Exiting now: ${new Date().toString()}`);
    console.warn("connector.exitHandler.exitNow");
    process.exit(0);
  }

  function exitInBit() {
    console.log(`Exiting in 30s: ${new Date().toString()}`);
    setTimeout(() => {
      exitImmediately();
    }, 30000);
  }

  function handleManualExit() {
    const waiting = 30000;
    debug("connector.exitHandler.handleExit", { waiting });
    // setTimeout(exitNow, waiting);
    console.log(`SIGINT Handling Exit: ${new Date().toString()}`);
    promise().then(exitImmediately, exitImmediately);
  }

  function handleAutomatedExit() {
    // const waiting = 30000;
    // debug("connector.exitHandler.handleExit", { waiting });
    // setTimeout(exitNow, waiting);
    console.log(`SIGTERM Handling Exit: ${new Date().toString()}`);
    promise().then(exitInBit, exitInBit);
  }

  function gracefulExit() {
    // const waiting = 30000;
    // debug("connector.exitHandler.handleExit", { waiting });
    // setTimeout(exitNow, waiting);
    console.log(`gracefulExit Handling Exit: ${new Date().toString()}`);
    promise().then(exitImmediately, exitImmediately);
  }

  // SIGINT is what we get from the console when we do a control+c
  process.on("SIGINT", handleManualExit);
  // SIGTERM is what DCOS sends to the process to tell it to shutdown nicely
  process.on("SIGTERM", handleAutomatedExit);
  process.on("gracefulExit", gracefulExit);
}

module.exports = onExit;
