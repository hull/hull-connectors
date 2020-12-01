/* eslint-disable global-require */
const _ = require("lodash");
const path = require("path");
const webpack = require("webpack");
const { env } = process;
const { CONNECTOR, PORT = 8082 } = env;

function devMode({ source, destination }) {
  const config = require("./webpack.config")({
    source: path.resolve(source),
    destination: path.resolve(destination),
    mode: "development"
  }) || { entry: undefined, output: {}, plugins: [] };
  return {
    ...config,
    devtool: "eval-cheap-module-source-map",
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
        ignored: ["node_modules"]
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
    optimization: {
      minimize: false,
      moduleIds: "named"
    },
    entry: config.entry
      ? _.reduce(
          config.entry,
          (m, v, k) => {
            m[k] = [
              "react-hot-loader/patch",
              "webpack-dev-server/client?http://0.0.0.0",
              v
            ];
            return m;
          },
          {}
        )
      : {},
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      ...config.plugins,
      new webpack.NoEmitOnErrorsPlugin()
    ]
  };
}

module.exports = devMode({
  source: `${CONNECTOR}/src`,
  destination: `${CONNECTOR}/dist`
});
