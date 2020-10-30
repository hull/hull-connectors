import _ from "lodash";

export default function resolveConfig(conf, envConfig) {
  const passedConfig = typeof conf === "function" ? conf() : conf;
  return _.reduce(
    envConfig,
    (finalConfig, value, key) => {
      finalConfig[key] = _.isPlainObject(value)
        ? {
            ...value,
            ..._.get(passedConfig, key, {})
          }
        : _.get(passedConfig, key, value);
      return finalConfig;
    },
    passedConfig
  );
}
