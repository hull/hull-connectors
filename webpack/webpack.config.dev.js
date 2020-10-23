/* eslint-disable global-require */
const _ = require("lodash");
const path = require("path");
const webpack = require("webpack");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");

const minimist = require("minimist");

const argv = minimist(process.argv);
const { env } = process;
const { PORT = 8082 } = env;

function devMode({ source, destination }) {
  const config = require("./webpack.config")({
    source: path.resolve(source),
    destination: path.resolve(destination),
    mode: "development"
  });

  return {
    ...config,
    devServer: {
      hot: true,
      hotOnly: true,
      inline: true,
      quiet: false,
      overlay: false,
      noInfo: false,
      watchContentBase: true,
      disableHostCheck: true,
      stats: { colors: true },
      publicPath: config.output.publicPath,
      public: "http://0.0.0.0",
      headers: { "Access-Control-Allow-Origin": "http://0.0.0.0" },
      contentBase: destination,
      watchOptions: {
        ignored: [/node_modules/]
      },
      historyApiFallback: {
        disableDotRule: true
      },
      proxy: {
        "/": {
          target: `http://0.0.0.0:${PORT}`
        }
      }
    },
    entry: _.reduce(
      config.entry,
      (m, v, k) => {
        m[k] = ["webpack-dev-server/client?http://0.0.0.0", v];
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
  source: `${argv.source}/src`,
  destination: `${argv.source}/dist`
});
