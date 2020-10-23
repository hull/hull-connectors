import { Connector } from "../index";

const argv = require("minimist")(process.argv.slice(2));

const noop = () => {};
(async () => {
  const { type, connector } = argv;
  const pwd = process.env.PWD;
  const manifestPath = `${pwd}/${connector}/manifest.json`;
  const handlerPath = `${pwd}/${connector}/server/index.js`;
  const connectorTypePath = `./${type}/`;
  const [
    { default: manifest },
    { default: handler },
    {
      /* userUpdate,  */ credentialsHandler,
      incomingHandler,
      middlewares = [],
      manifest: typeManifest
    }
  ] = await Promise.all([
    import(manifestPath),
    import(handlerPath),
    import(connectorTypePath)
  ]);
  const { private_settings = [], settings_sections = [] } = manifest;
  const mergedManifest = {
    ...typeManifest(),
    ...manifest,
    private_settings,
    settings_sections: [
      ...settings_sections,
      {
        title: "Webhook URL",
        step: "credentials",
        description:
          "Send a POST request to the URL below to start capturing data, Then open the Code editor to write logic on how to ingest it",
        properties: ["json.credentials"]
      }
    ]
  };
  return new Connector({
    manifest: mergedManifest,
    middlewares,
    handlers: {
      subscriptions: {
        // userUpdate: (userUpdate || noop)(handler),
      },
      json: {
        credentialsHandler: credentialsHandler || noop
      },
      incoming: {
        incomingHandler: (incomingHandler || noop)(handler)
      }
    }
  }).start();
})();
