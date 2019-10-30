// @flow
import _ from "lodash";
import type { HullAttributeMapping, HullUISelectData } from "hull";

const selectFromKey = (k: string = "") => ({
  label: _.last(k.split(".")),
  value: k
});

const mappingToOptions = ({
  mapping,
  label
}: {
  mapping: Array<HullAttributeMapping>,
  label: string
}): HullUISelectData => {
  const options = _.reduce(
    mapping,
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
    default: mapping
  };
};
export default mappingToOptions;
