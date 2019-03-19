// @flow
import mongoose from "mongoose";

type ModelParams = {
  mongoUrl: string,
  collectionSize: string | number,
  collectionName: string
};
export default function({
  mongoUrl,
  collectionSize,
  collectionName
}: ModelParams) {
  const fields = {
    connectorId: String,
    payload: Object,
    code: String,
    result: Object,
    date: Date
  };

  const options = {
    capped: {
      size: collectionSize,
      autoIndexId: true
    }
  };

  mongoose.Promise = global.Promise;

  const schema = new mongoose.Schema(fields, options).index({
    connectorId: 1,
    _id: -1
  });

  mongoose.connect(mongoUrl, { useNewUrlParser: true });
  return mongoose.model(collectionName, schema);
}
