module.exports = function healthCheckHandlerFactory(connector) {
  return (req, res) => {
    console.log(
      `${new Date().toString()} Checking health: ${connector.isExiting}`
    );
    if (connector.isExiting) {
      return res.status(503).json({
        ok: false,
        message: "Health Check Status 503, but still processing requests"
      });
    }
    return res.status(200).json({ ok: true });
  };
};
