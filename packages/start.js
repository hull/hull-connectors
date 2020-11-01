import Lightweight from "hull-lightweight/server";
import Standard from "hull/server";
import minimist from "minimist";
import path from "path";

(async () => {
  const { connector } = minimist(process.argv);
  const connectorPath = path.join(process.cwd(), connector);
  process.chdir(connectorPath);
  if (!connector) {
    throw new Error(
      "Missing connector - you need to define which connector to start"
    );
  }

  console.log(`Starting ${connector} from ${connectorPath}`)
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
