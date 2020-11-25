const _ = require("lodash");
const glob = require("glob");
const configBuilder = require("./webpack.config");
const minimist = require("minimist");
const path = require("path");

module.exports = () => {
  const { env } = minimist(process.argv);
  const sourceFolder = path.join(process.cwd(), env);
  const destinationFolder = path.join(
    process.cwd(),
    "dist",
    "connectors",
    path.basename(env)
  );
  console.log(`Webpack
from [${sourceFolder}]
to   [${destinationFolder}]`);
  const conf = configBuilder({
    source: `${sourceFolder}/src`,
    destination: `${destinationFolder}/dist`
  });
  if (conf) {
    console.log(`=> Detected client files for ${env}`);
    console.log(_.values(conf.entry));
    return [conf];
  } else {
    return [];
  }
};
