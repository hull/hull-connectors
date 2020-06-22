module.exports = function healthCheckHandlerFactory(connector) {
  return (req, res) => {
    if (connector.isExiting) {
      return res
        .status(503)
        .json({ ok: false, message: "Process is stopping" });
    }
    return res.status(200).json({ ok: true });
  };
};
