import scheduledCallHandler from "./scheduled-call-handler";

export { default as manifest } from "./manifest";
export const middlewares = [];
export const getHandlers = handler => ({
  schedules: {
    scheduledCall: scheduledCallHandler(handler)
  },
  json: {
    manualRun: scheduledCallHandler(handler)
  }
});
