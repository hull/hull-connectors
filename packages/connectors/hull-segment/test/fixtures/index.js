/* eslint-disable global-require */

const fixtures = {
  aliasPayload: require("./alias.json"),

  groupPayload: require("./group.json"),
  groupOutput: require("./group-output.json"),

  identifyPayload: require("./identify.json"),
  identifyOutput: require("./identify-output.json"),

  pagePayload: require("./page.json"),
  pageOutput: require("./page-output.json"),

  screenPayload: require("./screen.json"),
  screenOutput: require("./screen-output.json"),

  trackPayload: require("./track.json"),
  trackOutput: require("./track-output.json")
};

module.exports = fixtures;
