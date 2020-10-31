const glob = require("glob");
const webpack = require("webpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const chalk = require("chalk");
const _ = require("lodash");

const getFiles = source => glob.sync(`${source}/*.{js,jsx,css,scss}`);
const getEntry = files =>
  _.reduce(
    files,
    (m, v) => {
      m[
        v
          .split("/")
          .pop()
          .replace(/.(js|jsx|css|scss)$/, "")
      ] = v;
      return m;
    },
    {}
  );

const getPlugins = ({ mode, destination }) =>
  mode === "production"
    ? [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        new MiniCssExtractPlugin({
          filename: "[name].css",
          chunkFilename: "[id].css"
        }),
      ]
    : [
        new MiniCssExtractPlugin({
          filename: "[name].css",
          chunkFilename: "[id].css"
        })
      ];


const buildConfig = ({ files, destination, mode = "production" }) => ({
  mode,
  entry: getEntry(files),
  devtool: false,
  output: {
    path: path.resolve(destination),
    pathinfo: false,
    filename: "[name].js",
    publicPath: "/"
  },
  optimization: {
    minimize: true,
    minimizer: [
      "...",
      new CssMinimizerPlugin()
    ]
  },
  resolve: {
    modules: ["packages", "node_modules"],
    extensions: [".js", ".jsx", ".css", ".scss"]
  },

  cache: { type: "memory" },

  module: {
    rules: [
      {
        test: /\.(css|s[ac]ss)$/i,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader" },
          { loader: "sass-loader" }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader?cacheDirectory",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    modules: false,
                    useBuiltIns: "usage",
                    corejs: 3,
                    targets: {
                      browsers: [
                        "last 2 versions",
                        "Firefox ESR",
                        "> 1%",
                        "iOS >= 10"
                      ]
                    }
                  }
                ],
                "@babel/preset-react"
              ],
              plugins: ["lodash", "react-hot-loader/babel"]
            }
          }
        ]
      },
      // svg
      { test: /.svg$/, loader: "svg-inline-loader" }
      // // images & other files
      // {
      //   test: /\.jpe?g$|\.gif$|\.png|\.woff$|\.ttf$|\.wav$|\.mp3$/,
      //   type: "asset/resource"
      // }
    ]
  },
  plugins: getPlugins({ mode, destination })
});

module.exports = ({ source, destination, mode }) => {
  const files = getFiles(source);
  if (!files || !files.length) {
    return undefined;
  }

  return buildConfig({ files, destination, mode });
};
