/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import moment from "moment";
import _ from "lodash";
import type { Entry } from "../../types";

export default function getRecent(Model: Object) {
  return async (ctx: HullContext): Promise<HullExternalResponse> => {
    const { client, connector = {} } = ctx;
    const query = Model.find({ connectorId: connector.id })
      .sort({ date: -1 })
      .limit(100);

    try {
      const docs = await query.lean().exec();
      const recent: Array<Entry> =
        _.map(docs, item =>
          _.set(
            _.omit(item, ["_id", "__v", "connectorId"]),
            "date",
            moment(item.date).format("MMM Do YYYY, h:mm:ss A")
          )
        ) || [];

      return {
        status: 200,
        data: {
          recent
        }
      };
    } catch (err) {
      client.logger.debug("mongo.query.error", { errors: err });
      return {
        status: 500,
        data: {
          recent: []
        }
      };
    }
  };
}
