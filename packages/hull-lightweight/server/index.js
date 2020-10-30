import _ from "lodash";
import { Connector } from "hull";

const customizer = (objValue, srcValue /* , key, object, source, stack */) =>
  _.isArray(objValue) ? objValue.concat(srcValue) : undefined;

export default async ({ path, manifest, type }) => {
  // eslint-disable-next-line
  console.log(
    `Loading lightweight connector of type ${type} from ${path} on port ${process.env.PORT}`
  );

  const [
    { default: handler },
    { getHandlers, middlewares = [], manifest: manifestFactory }
  ] = await Promise.all([
    // eslint-disable-next-line
    import(`${path}/server/index`),
    // eslint-disable-next-line
    import(`./templates/${type}/`)
  ]);

  const typeManifest = manifestFactory();

  return new Connector({
    manifest: _.mergeWith({}, typeManifest, manifest, customizer),
    middlewares,
    handlers: getHandlers(handler)
  }).start();
};
