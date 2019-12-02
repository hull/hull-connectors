// @flow
import type { HullContext, HullExternalResponse } from "hull";

export default function removeOldEntriesHandler(EntryModel: Object) {
  return async function statusCheck(
    ctx: HullContext
  ): Promise<HullExternalResponse> {
    const { connector, client } = ctx;

    const query = EntryModel.find({ connectorId: connector.id })
      .sort({ date: -1 })
      .limit(100);

    return new Promise((resolve, _reject) => {
      query.lean().exec((err, docs) => {
        if (err) {
          client.logger.debug("mongo.query.error", { errors: err });
          return resolve({
            status: 500,
            data: {}
          });
        }
        if (docs && docs.length >= 100) {
          const last = docs[docs.length - 1];
          const removeQuery = EntryModel.remove({
            connectorId: connector.id,
            date: { $lt: last.date }
          });
          removeQuery.lean().exec(() => {
            return resolve({
              status: 200,
              data: {
                result: "groomed"
              }
            });
          });
          return undefined;
        }
        return resolve({
          status: 200,
          data: {
            result: "not enough entries to groom"
          }
        });
      });
      return undefined;
    });
  };
}
