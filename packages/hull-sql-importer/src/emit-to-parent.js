const emitToParent = query =>
  window.parent.postMessage(
    JSON.stringify({
      from: "embedded-ship",
      action: "update",
      ship: { private_settings: { query } }
    }),
    "*"
  );

export default emitToParent;
