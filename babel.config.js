module.exports = api => {
  api.cache.never();
  return {
    only: [
      "packages/connectors/*/server",
      "packages/connectors/*/src",
      "packages/server",
      "packages/hull/src",
      "packages/hull-client/src"
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
      "@babel/plugin-transform-runtime",
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-syntax-object-rest-spread",
      "@babel/plugin-proposal-class-properties"
    ]
  };
};
