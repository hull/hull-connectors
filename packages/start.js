import Lightweight from "hull-lightweight/server";
import Standard from "hull/server";
import minimist from "minimist";
import path from "path";

(async () => {
  const { connector } = minimist(process.argv);
  console.log("Start.js, Connector", {
    args: minimist(process.argv),
    connector,
    cwd: process.cwd(),
    PWD: process.env.PWD,
    __dirname
  });
  const connectorPath = path.join(process.cwd(), connector);
  console.log("Start.js, ConnectorPath", { connectorPath });

  process.chdir(connectorPath);
  if (!connector) {
    throw new Error(
      "Missing connector - you need to define which connector to start"
    );
  }

  try {
    const { default: manifest } = await import(
      `${connectorPath}/manifest.json`
    );
    const { type } = manifest;
    // console.log({manifest, connectorPath})
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
