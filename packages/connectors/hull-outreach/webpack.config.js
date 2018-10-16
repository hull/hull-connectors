const glob = require("glob");
const path = require("path");
const _ = require("lodash");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const HappyPack = require("happypack");
const moment = require("moment");

const isProduction = () => process.env.NODE_ENV === "production";

let plugins = [
  new HappyPack({
    id: "jsx",
    threads: 4,
    loaders: [
      {
        loader: require.resolve("babel-loader"),
        query: {
          plugins: [require.resolve("react-hot-loader/babel")],
        },
      },
    ],
  }),
  new HappyPack({
    id: "styles",
    threads: 2,
    loaders: [
      { loader: require.resolve("style-loader") },
      { loader: require.resolve("css-loader") },
      { loader: require.resolve("sass-loader") },
      {
        loader: require.resolve("postcss-loader"),
        options: {
          indent: "postcss",
          plugins: () => [
            require("postcss-flexbugs-fixes"), // eslint-disable-line
            autoprefixer({
              browsers: [
                ">1%",
                "last 4 versions",
                "Firefox ESR",
                "not ie < 9", // React doesn't support IE8 anyway
              ],
              flexbox: "no-2009",
            }),
          ],
        },
      },
    ],
  }),
  new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      BUILD_DATE: JSON.stringify(moment().format("MMMM, DD, YYYY, HH:mm:ss")),
      GIT_COMMIT: JSON.stringify(process.env.CIRCLE_SHA1 || ""),
    },
  }),
  new webpack.SourceMapDevToolPlugin({ filename: "[file].map" }),
];

if (isProduction()) {
  plugins = [
    ...plugins,
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: { warnings: false, screw_ie8: false },
    }),
  ];
}

const entry = _.reduce(
  glob.sync(path.join(process.cwd(), "src/*.js")),
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

module.exports = {
  devtool: isProduction() ? "source-map" : "inline-source-map",

  performance: {
    hints: isProduction() ? "warning" : false,
  },

  entry,

  output: {
    path: path.join(process.cwd(), "dist"),
    filename: "[name].js",
    publicPath: "/",
  },

  plugins,

  resolve: {
    modules: [path.join(process.cwd(), "src"), "node_modules"],
    extensions: [".js", ".jsx", ".css", ".scss"],
  },

  resolveLoader: {
    modules: ["node_modules", path.join(process.cwd(), "node_modules")],
  },

  module: {
    rules: [
      {
        test: /\.jsx|\.js$/,
        loader: require.resolve("happypack/loader"),
        query: { id: "jsx" },
        exclude: /node_modules/,
      },
      // styles
      {
        test: /\.(css|scss)$/,
        loader: require.resolve("happypack/loader"),
        query: { id: "styles" },
      },
      // svg
      { test: /.svg$/, loader: "svg-inline-loader" },
      // images & other files
      {
        test: /\.jpe?g$|\.gif$|\.png|\.woff$|\.ttf$|\.wav$|\.mp3$/,
        loader: "file-loader",
      },
    ],
  },
};
