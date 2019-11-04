// @flow
import _ from "lodash";
import type { HullContext, HullAttributeMapping, HullUISelectData } from "hull";

const selectFromKey = (k: string = "") => ({
  label: _.last(k.split(".")),
  value: k
});

const mappingToOptions = (
  ctx: HullContext,
  {
    name,
    label
  }: {
    name: string,
    label: string
  }
): HullUISelectData => {
  const { connector } = ctx;
  const { manifest } = connector;

  // $FlowFixMe
  const defaults: Array<HullAttributeMapping> = (
    _.find(manifest.private_settings, { name }) || {}
  ).default;
  if (!defaults) {
    return {};
  }
  const options = _.reduce(
    defaults,
    (m, entry) => {
      const { service } = entry;
      if (service.indexOf(".") > -1) {
        const path = service.split(".");
        const prefix = _.initial(path) || [];
        const opts = _.get(m, [...prefix, "options"]) || [];
        _.set(m, prefix, {
          label: _.last(prefix),
          options: [...opts, selectFromKey(service)]
        });
      } else {
        _.set(m, service, selectFromKey(service));
      }
      return m;
    },
    {}
  );
  return {
    label,
    options: _.sortBy(_.values(options), v => !!_.get(v, "options")),
    default: defaults
  };
};
export default mappingToOptions;
