// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import BluebirdPromise from "bluebird";
import _ from "lodash";
import { saveProspect } from "../lib/side-effects";

import Client from "../clearbit/client";
// import Promise from "bluebird";
import { performProspect } from "../clearbit/prospect";

const prospect = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  // $FlowFixMe
  const { domains, role, seniority, titles = [], limit } = message.body;
  if (!domains.length) {
    return { status: 404, data: { message: "Empty list of domains" } };
  }
  const clearbitClient = new Client(ctx);
  const responses = await BluebirdPromise.mapSeries(domains, async domain => {
    const account = { domain };
    const { prospects } = await performProspect({
      settings: {
        prospect_filter_role: role,
        prospect_filter_seniority: seniority,
        prospect_filter_titles: titles,
        prospect_filter_limit: limit
      },
      client: clearbitClient,

      // $FlowFixMe
      message: { account }
    });
    return prospects;
    // return Promise.all(
    // $FlowFixMe
    // prospects.map(person => saveProspect(ctx, { account, person }))
    // );
  });
  const prospects = _.flatten(responses.map(_.values));
  // const prospects = _.reduce(
  //   responses,
  //   (m, v) => {
  //     _.map(v, (p, email) => {
  //       m[email] = p;
  //     });
  //     return m;
  //   },
  //   {}
  // );
  return { status: 200, data: { prospects: _.flatten(prospects) } };
};
export default prospect;
