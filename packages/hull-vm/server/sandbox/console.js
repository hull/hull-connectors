// @noflow
import type { Result } from "../../types";

export default function buildConsole(
  { errors, logs, logsForLogger }: Result,
  preview: boolean
) {
  function log(...args) {
    logs.push(args);
  }
  function logDebug(...args) {
    // Only show debug logs in preview mode
    if (preview) {
      logs.push(args);
    }
  }
  function logError(...args) {
    logs.push(args);
    errors.push(args);
  }
  function logInfo(...args) {
    logs.push(args);
    logsForLogger.push(args);
  }
  return {
    log,
    warn: log,
    debug: logDebug,
    info: logInfo,
    error: logError
  };
}
