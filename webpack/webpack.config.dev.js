/* eslint-disable global-require */
const _ = require("lodash");
const path = require("path");
const webpack = require("webpack");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");

const minimist = require("minimist");

const argv = minimist(process.argv);
const { env } = process;
const { PORT = 8082 } = env;
const { source } = argv;

function devMode({ port = 3000, source, destination }) {
  const config = require("./webpack.config")({
    source: path.resolve(source),
    destination: path.resolve(destination),
    mode: "development"
  });

  return {
    ...config,
    devServer: {
      contentBase: destination,
      hot: true,
      port,
      disableHostCheck: true,
      proxy: {
        "/": {
          target: `http://localhost:${PORT}`
        }
      }
    },
    entry: _.reduce(
      config.entry,
      (m, v, k) => {
        m[k] = v;
        return m;
      },
      {}
    ),
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      ...config.plugins,
      new webpack.NamedModulesPlugin(),
      new ProgressBarPlugin({ clear: false }),
      new webpack.NoEmitOnErrorsPlugin()
    ]
  };
}

module.exports = devMode({
  source: `${source}/src`,
  destination: `${source}/dist`
});
