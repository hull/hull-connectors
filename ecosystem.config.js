const fs = require("fs");
const util = require("util");
const pm2 = require("pm2");

const { fetchParams } = require("./scripts/entrypoint.js");

const { CONNECTORS = "", CONNECTOR, max_memory_restart = "1G" } = process.env;
const START_PORT = 3000;

(ENV => {
  pm2.connect(async err => {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    const { MESOS_TASK_ID } = ENV;

    const environment = MESOS_TASK_ID
      ? MESOS_TASK_ID.split("_")[0]
      : "development";

    const SSM_ENV = await fetchParams(`/${environment}/connectors/`);
    const connectorsList = fs.readdirSync("dist/connectors");
    let i = 0;
    const start = util.promisify(pm2.start.bind(pm2));
    Promise.all(
      connectorsList.map(async name => {
        i += 1;
        if (CONNECTORS.includes(name) || CONNECTOR === name) {
          const SSM_CONNECTOR_ENV = await fetchParams(
            `/${environment}/connectors/${name}`
          );
          const script = `dist/connectors/${name}/server/index.js`;
          return start({
            name,
            script,
            exec_mode: "cluster",
            instances: "max",
            autorestart: true,
            watch: false,
            max_memory_restart,
            env: {
              ...SSM_ENV,
              ...SSM_CONNECTOR_ENV,
              NODE_ENV: "production",
              CONNECTOR: name,
              PORT: START_PORT + i
            }
          });
        }
        return true;
      })
    ).then(() => {
      console.warn("All apps started");
      pm2.disconnect();
      process.exit(0);
    });
  });
})(process.env);
