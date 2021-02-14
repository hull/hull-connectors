"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = devMode;

var _webpackDevMiddleware = _interopRequireDefault(require("webpack-dev-middleware"));

var _webpack = _interopRequireDefault(require("webpack"));

var _webpack2 = _interopRequireDefault(require("../webpack.config"));

function devMode() {
  const compiler = (0, _webpack.default)(_webpack2.default);
  return (0, _webpackDevMiddleware.default)(compiler, {
    publicPath: _webpack2.default.output.publicPath,
    contentBase: "src",
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });
}