module.exports = api => {
  api.cache.never();
  return {
    only: [
      "packages/connectors/*/server",
      "packages/connectors/*/test",
      "packages/connectors/*/src",
      "packages/minihull/src",
      "packages/hull/src",
      "packages/hull-vm/server",
      "packages/hull-vm/src",
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
      "@babel/plugin-syntax-export-default-from",
      "@babel/plugin-transform-runtime",
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-syntax-object-rest-spread",
      "@babel/plugin-proposal-class-properties"
    ]
  };
};
