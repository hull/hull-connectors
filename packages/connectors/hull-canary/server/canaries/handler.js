const _ = require("lodash");

const {
  resetAll,
  getState,
  hasStarted,
  hasCompleted,
  getActiveCanary,
  hasNextCanary,
  nextCanary
} = require("./state");

// const defaultTags = [`environment:${process.env.ENVIRONMENT}`];

let allCanariesStatus = {};

let canaryTimeoutReference = null;
let canaryStartTime = null;

let latestContext;

// We need to have this hull in memory
// because we're doing stuff in the background with the timeout
// in which case we'll need client for the next step
// also need to report metrics on a timeout or on other failed states
// some failed states originate with a request which has it's own context which we could use
// but I think it's better just to use this one consistently rather than introducing
// more complext "use this context this time" logic

// Timeout and start the next canary if it takes too long
function canaryTimeoutCallback() {
  canariesStartNext(true);
}

/*
 * Could be called by the test directly in a case when the test completes early (fail or success)
 * Could also be called by a timeout
 */
function canariesStartNext(previousFailed, reasonFailed) {
  if (hasCompleted()) return;

  if (canaryTimeoutReference != null) {
    // clear timeout if it's still out there
    clearTimeout(canaryTimeoutReference);
  }

  // const { metric } = hullContext;

  if (hasStarted()) {
    const previousCanary = getActiveCanary();
    console.log(`Previous: ${JSON.stringify(previousCanary)}`);

    // const tags = _.concat(defaultTags, `canary-test:${previousCanary.name}`);

    if (previousFailed) {
      allCanariesStatus[previousCanary.name] = {
        status: "fail",
        reason: reasonFailed,
        final_state: getState(),
        timeToRun: Date.now() - canaryStartTime
      };
      // metric.value("canary.status.failed", 1, tags);
    } else {
      allCanariesStatus[previousCanary.name] = {
        status: "success",
        final_state: getState(),
        timeToRun: Date.now() - canaryStartTime
      };
      // metric.value("canary.status.success", 1, tags);
    }
  }

  canaryStartTime = Date.now();

  canaryTimeoutReference = null;

  if (hasNextCanary()) {
    nextCanary();
    const activeCanary = getActiveCanary();

    // const tags = _.concat(defaultTags, `canary-test:${activeCanary.name}`);
    // metric.value("canary.status.started", 1, tags);

    console.log(`Active: ${JSON.stringify(activeCanary)}`);
    allCanariesStatus[activeCanary.name] = {
      status: "inprogress"
    };
    activeCanary.initialize(latestContext);
    canaryTimeoutReference = setTimeout(
      canaryTimeoutCallback,
      activeCanary.timeToComplete
    );
  } else {
    // calling next canary even if there isn't one, so that we put this test
    // in the Completed state with no active canary
    nextCanary();
  }
}

function canariesStatus(req, res) {
  return {
    status: 200,
    data: allCanariesStatus
  };
}

function canariesRestart(hullContext) {
  latestContext = hullContext;
  allCanariesStatus = {};
  resetAll();
  canariesStartNext(false);
  return {
    status: 200,
    data: allCanariesStatus
  };
}

module.exports = {
  canariesRestart,
  canariesStartNext,
  canariesStatus
};
