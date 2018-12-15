const _ = require("lodash");
const glob = require("glob");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const LodashModuleReplacementPlugin = require("lodash-webpack-plugin");

const getFiles = source => glob.sync(`${source}/*.js`);
const getEntry = files =>
  _.reduce(
    files,
    (m, v) => {
      m[
        v
          .split("/")
          .pop()
          .replace(".js", "")
      ] = v;
      return m;
    },
    {}
  );

const getPlugins = mode =>
  mode === "production"
    ? [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        new LodashModuleReplacementPlugin({
          collections: true,
          paths: true
        }),
        new MiniCssExtractPlugin({ filename: "[name].css" })
      ]
    : [];

const buildConfig = ({ files, destination, mode = "production" }) => ({
  mode,
  entry: getEntry(files),
  devtool: mode === "production" ? "source-map" : "inline-source-map",
  output: {
    path: destination,
    filename: "[name].js",
    publicPath: "/"
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "eslint-loader"
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { modules: false }],
              "@babel/preset-react"
            ],
            plugins: ["lodash", "react-hot-loader/babel"]
          }
        }
      },
      // svg
      { test: /.svg$/, loader: "svg-inline-loader" },
      // images & other files
      {
        test: /\.jpe?g$|\.gif$|\.png|\.woff$|\.ttf$|\.wav$|\.mp3$/,
        loader: "file-loader"
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      }
    ]
  },
  plugins: getPlugins(mode)
});

module.exports = ({ source, destination, mode }) => {
  const files = getFiles(source);
  if (!files || !files.length) {
    return undefined;
  }
  return buildConfig({ files, destination, mode });
};
