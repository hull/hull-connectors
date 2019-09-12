// @flow
import type { HullUser } from "hull";
import _ from "lodash";
/*
 * returns a sample set of 3 keys picked at random in the source object to simulate a changes object.
 * We are omitting `account` and `segment_ids` from this preview changes object.
 *
 * @param  {User|Account payload} source a User or Account, flat format (not grouped)
 * @return {Object}        A user change or account change dummy object to simulate one that we would receive with actual notifications
 */
const getSample = (source: HullUser) =>
  _.reduce(
    _.sampleSize(_.omit(_.keys(source), "account", "segment_ids"), 3),
    (m, k: string) => {
      m[k] = [null, source[k]];
      m.THOSE_ARE_FOR_PREVIEW_ONLY = [null, "fake_values"];
      return m;
    },
    {}
  );

export default getSample;
