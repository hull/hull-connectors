function fail(res, message) {
  return res.status(503).json({ ok: false, message });
}

module.exports = function healthCheckHandlerFactory(connector, startTime) {
  function isWarmedUp() {
    if (!startTime) return false;
    return startTime < (Date.now() - 5000);
  }
  return (req, res) => {
    if (connector.isExiting) {
      return fail(res, "Process exiting");
    }

    if (!isWarmedUp()) {
      return fail(res, "Warming up");
    }

    return res.status(200).json({ ok: true });
  };
};
