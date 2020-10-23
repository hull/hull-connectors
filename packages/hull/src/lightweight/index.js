import _ from "lodash";
import { Connector } from "../index";

const pwd = process.env.PWD;
const { connector } = require("minimist")(process.argv.slice(2));

const noop = () => {};

const customizer = (objValue, srcValue /* , key, object, source, stack */) =>
  _.isArray(objValue) ? objValue.concat(srcValue) : undefined;

(async () => {
  const manifestPath = `${pwd}/${connector}/manifest.json`;
  const handlerPath = `${pwd}/${connector}/server`;

  const [manifest, { default: handler }] = await Promise.all([
    import(manifestPath),
    import(handlerPath)
  ]);

  const { type } = manifest;
  console.log(`Loading lightweight connector of type ${type}`);

  const {
    /* userUpdate,  */ credentialsHandler,
    incomingHandler,
    middlewares = [],
    manifest: manifestFactory
  } = await import(`./${type}/`);
  const typeManifest = manifestFactory();

  return new Connector({
    manifest: _.mergeWith({}, typeManifest, manifest, customizer),
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
