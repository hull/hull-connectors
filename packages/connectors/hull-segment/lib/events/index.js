"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _track = _interopRequireDefault(require("./track"));

var _group = _interopRequireDefault(require("./group"));

var _alias = _interopRequireDefault(require("./alias"));

var _page = _interopRequireDefault(require("./page"));

var _screen = _interopRequireDefault(require("./screen"));

var _identify = _interopRequireDefault(require("./identify"));

var _default = {
  track: _track.default,
  group: _group.default,
  alias: _alias.default,
  page: _page.default,
  screen: _screen.default,
  identify: _identify.default
};
exports.default = _default;