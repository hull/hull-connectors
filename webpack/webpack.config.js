const glob = require("glob");
const webpack = require("webpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const _ = require("lodash");

// const LodashModuleReplacementPlugin = require("lodash-webpack-plugin");

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

const getPlugins = ({ mode, assets, destination }) =>
  mode === "production"
    ? [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        // new LodashModuleReplacementPlugin({
        //   collections: true,
        //   paths: true
        // }),
        new ESLintPlugin(),
        new MiniCssExtractPlugin({ filename: "[name].css" }),
        new CopyPlugin([
          {
            from: assets,
            to: path.resolve(destination)
          }
        ])
      ]
    : [new MiniCssExtractPlugin({ filename: "[name].css" })];

const buildConfig = ({ assets, files, destination, mode = "production" }) => ({
  mode,
  entry: getEntry(files),
  devtool: mode === "production" ? "source-map" : "eval-source-map",
  output: {
    path: path.resolve(destination),
    filename: "[name].js",
    publicPath: "/"
  },

  resolve: {
    modules: [`${process.cwd()}/packages`, "node_modules"],
    extensions: [".js", ".jsx", ".css", ".scss"]
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader?cacheDirectory",
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
  plugins: getPlugins({ mode, assets, destination })
});

module.exports = ({ assets, source, destination, mode }) => {
  const files = getFiles(source);
  if (!files || !files.length) {
    return undefined;
  }

  console.log(`${process.cwd()}/packages`);
  return buildConfig({ assets, files, destination, mode });
};
