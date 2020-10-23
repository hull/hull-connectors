export default function resolveConfig(conf, envConfig) {
  const passedConfig = typeof conf === "function" ? conf() : conf;

  const connectorConfig = {
    ...passedConfig
  };

  Object.keys(envConfig).forEach(k => {
    const val = envConfig[k];
    if (typeof val === "object") {
      connectorConfig[k] = {
        ...(envConfig[k] || {}),
        ...(passedConfig[k] || {})
      };
    } else {
      connectorConfig[k] = passedConfig[k] || val;
    }
  });
  return connectorConfig;
}
