module.exports = api => {
  api.cache.never();
  return {
    only: [
      "packages/connectors/*/server",
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
    plugins: ["transform-flow-strip-types", "syntax-object-rest-spread"]
  };
};
