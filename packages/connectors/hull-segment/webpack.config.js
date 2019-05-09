var path = require("path");
var webpack = require("webpack");

const isProduction = () => process.env.NODE_ENV === "development";
module.exports = {
  mode: isProduction() ? "production" : "development",
  entry: {
    ship: path.join(__dirname, "src/index.js")
  },

  output: {
    path: path.join(__dirname, "/dist/"),
    filename: "[name].js",
    publicPath: "/"
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    })
  ],

  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, "test"),
          path.resolve(__dirname, "src")
        ],
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      browsers: "last 2 versions"
                    }
                  }
                ],
                "@babel/preset-flow"
              ],
              plugins: [
                "@babel/transform-flow-comments",
                [
                  "@babel/plugin-proposal-object-rest-spread",
                  { useBuiltIns: true }
                ]
              ]
            }
          }
        ]
      }
    ]
  }
};
