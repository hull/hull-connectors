module.exports = function healthCheckHandlerFactory(connector) {
  return (req, res) => {
    console.log(
      `${new Date().toString()} Checking health: ${connector.isExiting}`
    );
    if (connector.isExiting) {
      return res
        .status(200)
        .json({ ok: false, message: "Still sending 200, processing still allowed" });
    }
    return res.status(200).json({ ok: true });
  };
};
