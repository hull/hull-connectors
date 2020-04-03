const {
  hasStarted,
  hasCompleted,
  getActiveStage,
  hasNextStage,
  nextStage,
  getStageStatus,
  receiveUserUpdate,
  receiveAccountUpdate
} = require("./state");

const { canariesStartNext } = require("./handler");

function canaryNotify(updateChannel, context, messages) {
  if (!hasStarted() || hasCompleted()) return;

  let updatePromise = Promise.resolve();
  if (updateChannel === "user:update") {
    updatePromise = receiveUserUpdate(messages, context);
  } else if (updateChannel === "account:update") {
    updatePromise = receiveAccountUpdate(messages, context);
  }

  return updatePromise.then(() => {
    const stageStatus = getStageStatus();
    if (stageStatus.failed) {
      canariesStartNext(true);
    } else if (stageStatus.completed) {
      console.log("Current Stage Complete");
      const activeCanaryStage = getActiveStage();
      if (activeCanaryStage.successCallback) {
        activeCanaryStage.successCallback(context);
      }

      if (hasNextStage()) {
        nextStage();
      } else {
        canariesStartNext(false);
      }
    }
  });
}

module.exports = {
  canaryNotify
};
