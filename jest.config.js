// jest.config.js
module.exports = {
  testMatch: [
    "<rootDir>/packages/connectors/hull-typeform/test/**/*.(test|spec).js",
    "<rootDir>/packages/connectors/hull-outreach/test/**/*.(test|spec).js",
    "<rootDir>/packages/connectors/hull-marketo/test/**/*.(test|spec).js",
    "<rootDir>/packages/connectors/hull-warehouse/test/**/*.(test|spec).js",
    "<rootDir>/packages/connectors/hull-customerio/test/**/*.(test|spec).js",
    "<rootDir>/packages/connectors/hull-slack/test/**/*.(test|spec).js",
    "<rootDir>/packages/hull-connector-framework/test/**/*.(test|spec).js",
    "<rootDir>/packages/connectors/hull-pipedrive/test/**/*.(test|spec).js"
  ],
  collectCoverageFrom: [
    "<rootDir>/packages/connectors/hull-typeform/server/**/*.js",
    "<rootDir>/packages/connectors/hull-outreach/server/**/*.js",
    "<rootDir>/packages/connectors/hull-marketo/server/**/*.js",
    "<rootDir>/packages/connectors/hull-warehouse/server/**/*.js",
    "<rootDir>/packages/connectors/hull-customerio/server/**/*.js",
    "<rootDir>/packages/connectors/hull-slack/test/**/*.(test|spec).js",
    "<rootDir>/packages/hull-connector-framework/src/**/*.(test|spec).js"
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
  modulePathIgnorePatterns: ["<rootDir>/dist"],
  testEnvironment: "node"
};
