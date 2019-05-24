const _ = require("lodash");
const glob = require("glob");
const configBuilder = require("./webpack.config");

module.exports = function buildConfig() {
  const sourceFolder = `${__dirname}/../packages/connectors`;
  const destinationFolder = `${__dirname}/../dist/connectors`;
  const configurations = _.compact(
    glob.sync(`${sourceFolder}/*`).reduce((configs, c) => {
      const name = c.split("/").pop();
      const conf = configBuilder({
        source: `${sourceFolder}/${name}/src`,
        destination: `${destinationFolder}/${name}/dist`
      });
      if (conf) {
        console.log(`=> Detected client files for ${name}`);
        console.log(_.values(conf.entry));
        configs.push({ ...conf, name });
      }
      return configs;
    }, [])
  );
  return configurations;
};
