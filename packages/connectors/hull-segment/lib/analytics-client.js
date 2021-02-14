"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _analyticsNode = _interopRequireDefault(require("analytics-node"));

module.exports = function analyticsClientFactory() {
  const analytics = {};
  return function analyticsClient(write_key) {
    const a = analytics[write_key];
    if (!a) analytics[write_key] = new _analyticsNode.default(write_key);
    return analytics[write_key];
  };
};