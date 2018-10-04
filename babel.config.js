module.exports = api => {
  api.cache.never();
  return {
    only: ["packages/connectors/*/server", "packages/*/src"],
    plugins: ["transform-flow-strip-types", "syntax-object-rest-spread"]
  };
};
