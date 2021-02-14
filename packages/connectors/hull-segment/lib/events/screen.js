"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handleScreen;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _track = _interopRequireDefault(require("./track"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function handleScreen(payload = {}, context = {}) {
  const _context$ship = context.ship,
        ship = _context$ship === void 0 ? {} : _context$ship;

  const _ref = ship.settings || {},
        handle_screens = _ref.handle_screens;

  if (handle_screens === false) {
    return false;
  }

  const properties = payload.properties;

  if (!properties.name && payload.name) {
    properties.name = payload.name;
  }

  const screen = _objectSpread(_objectSpread({}, payload), {}, {
    properties,
    event: "screen",
    active: true
  });

  return (0, _track.default)(screen, context).then(() => {
    context.hull.asUser(payload).logger.debug("incoming.screen.success");
  }, error => {
    context.hull.asUser(payload).logger.error("incoming.screen.error", {
      errors: error
    });
  });
}