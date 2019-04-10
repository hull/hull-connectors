// @flow

export default function buildConsole(
  { errors, logs, logsForLogger }: Result,
  preview: boolean
) {
  function log(...args) {
    logs.push(args);
  }
  function debug(...args) {
    // Only show debug logs in preview mode
    if (preview) {
      logs.push(args);
    }
  }
  function logError(...args) {
    errors.push(args);
  }
  function info(...args) {
    logs.push(args);
    logsForLogger.push(args);
  }
  return {
    log,
    warn: log,
    error: logError,
    debug,
    info
  };
}
