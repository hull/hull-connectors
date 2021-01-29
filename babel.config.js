module.exports = api => {
  api.cache(true);
  return {
    only: [
      "packages/start.js",
      "root-babel-register.js",
      "packages/minihull/src",

      "packages/connectors/*/server",
      "packages/connectors/*/src",
      "packages/connectors/*/test",

      "packages/hull/server",
      "packages/hull/src",
      "packages/hull/test",

      "packages/hull-vm/server",
      "packages/hull-vm/src",
      "packages/hull-vm/test",

      "packages/hull-lightweight/server",

      "packages/hull-webhooks/server",
      "packages/hull-webhooks/src",
      "packages/hull-webhooks/test",

      "packages/hull-sql-exporter/src",
      "packages/hull-sql-exporter/server",
      "packages/hull-sql-exporter/test",

      "packages/hull-sql/src",
      "packages/hull-sql/server",
      "packages/hull-sql/test",

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
