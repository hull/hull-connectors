import _ from "lodash";
import { Connector } from "hull";

const { connector } = require("minimist")(process.argv.slice(2));

process.chdir(`${process.cwd()}/${connector}/server`);
const cwd = process.cwd();

const customizer = (objValue, srcValue /* , key, object, source, stack */) =>
  _.isArray(objValue) ? objValue.concat(srcValue) : undefined;

(async () => {
  const manifestPath = `${cwd}/../manifest.json`;
  const handlerPath = `${cwd}`;
  const manifest = await import(manifestPath);
  const { type } = manifest;
  console.log(
    `Loading lightweight connector of type ${type} on port ${process.env.PORT}`
  );

  const [
    { default: handler },
    { getHandlers, middlewares = [], manifest: manifestFactory }
  ] = await Promise.all([import(handlerPath), import(`./templates/${type}/`)]);

  const typeManifest = manifestFactory();

  return new Connector({
    manifest: _.mergeWith({}, typeManifest, manifest, customizer),
    middlewares,
    handlers: getHandlers(handler)
  }).start();
})();
