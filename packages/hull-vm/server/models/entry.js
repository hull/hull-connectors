// @flow
import mongoose from "mongoose";

// Need a global schema to avoid re-creating it several times in Tests;
let schema;

type ModelParams = {
  mongoUrl: string,
  collectionName: string
};
export default function Entry({ mongoUrl, collectionName }: ModelParams) {
  mongoose.Promise = global.Promise;
  mongoose.connect(mongoUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
  });
  schema =
    schema ||
    new mongoose.Schema(
      {
        connectorId: String,
        payload: Object,
        code: String,
        result: Object,
        date: Date
      },
      {}
    )
      .index({ connectorId: 1, _id: -1 })
      .index({ connectorId: 1, date: -1 });
  return mongoose.model(collectionName, schema);
}
