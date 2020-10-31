module.exports = api => {
  api.cache(true);
  return {
    only: [
      "packages/start.js",
      "root-babel-register.js",
      "packages/connectors/*/server",
      "packages/connectors/*/src",
      "packages/minihull/src",
      "packages/hull/server",
      "packages/hull/src",
      "packages/hull-vm/server",
      "packages/hull-vm/src",
      "packages/hull-lightweight/server",
      "packages/hull-webhooks/src",
      "packages/hull-webhooks/server",
      "packages/hullrepl/src",
      "packages/hull-client/src",
      "packages/hull-connector-framework/src",
      "packages/hull-connector-framework/test"
    ],
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            node: "current"
          }
        }
      ]
    ],
    plugins: [
      ["dynamic-import-node", { noInterop: true }],
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-syntax-export-default-from",
      "@babel/plugin-transform-runtime",
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-syntax-object-rest-spread",
      "@babel/plugin-proposal-class-properties"
    ]
  };
};
