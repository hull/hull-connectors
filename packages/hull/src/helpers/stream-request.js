// @flow
import superagent from "superagent";
import { chain } from "stream-chain";
import { parser as csvParser } from "stream-csv-as-json";
import { parser as jsonParser } from "stream-json";
import { asObjects } from "stream-csv-as-json/AsObjects";
import { streamValues } from "stream-json/streamers/StreamValues";
import type { HullContext } from "../types";
import { batchStream } from "../utils/batch-stream";

type HullStreamOptions = {
  url: string,
  format: string,
  batchSize: number,
  onData: (Array<any>) => Promise<any>,
  onEnd: any => any,
  onError: Error => any
};

const noop = () => {};

const streamRequest = (ctx: HullContext) => async ({
  format = "json",
  url,
  batchSize = 100,
  onError = noop,
  onData = noop,
  onEnd = noop
}: HullStreamOptions): Promise<any> => {
  const { client } = ctx;

  let chunk = 0;
  let row = 0;
  const errors = [];

  const pipeline = chain([
    format === "csv" ? csvParser() : jsonParser(),
    asObjects(),
    streamValues(),
    ({ value }) => value,
    batchStream({ size: batchSize }),
    async data => {
      chunk += 1;
      client.logger.info("incoming.job.progress", {
        row,
        chunk
      });
      row += data.length;
      return onData(data);
    }
  ]);

  client.logger.info("incoming.job.start", {
    format,
    url
  });

  superagent
    .get(url)
    .pipe(pipeline)
    .on("error", async error => {
      const errorResponse = await onError(error);
      client.logger.info("incoming.job.error", {
        error,
        errorResponse
      });
      errors.push(errorResponse);
    })
    .on("end", () => {
      client.logger.info("incoming.job.finished", {
        chunks: chunk,
        rows: row,
        errors
      });
      onEnd();
    });
};

module.exports = streamRequest;
