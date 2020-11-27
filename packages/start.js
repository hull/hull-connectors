import Lightweight from "hull-lightweight/server";
import Standard from "hull/server";
import path from "path";

(async () => {
  const { PATH_TO_CONNECTOR } = process.env;
  if (!PATH_TO_CONNECTOR) {
    throw new Error(
      "Missing connector - you need to define which connector to start"
    );
  }

  console.log("Start.js, Connector", {
    PATH_TO_CONNECTOR,
    cwd: process.cwd(),
    PWD: process.env.PWD,
    __dirname
  });

  const connectorPath = path.join(process.env.PWD, PATH_TO_CONNECTOR);
  process.chdir(connectorPath);

  try {
    const { default: manifest } = await import(
      `${connectorPath}/manifest.json`
    );
    const { type } = manifest;
    if (type) {
      Lightweight({ path: connectorPath, type, manifest });
    } else {
      Standard({ path: connectorPath, manifest });
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
})();
