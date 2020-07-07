// @flow
const CSVStream = require("csv-stream");
const JSONStream = require("JSONStream");
const requestClient = require("request");
const BatchStream = require("batch-stream");
const _ = require("lodash");
const promisePipe = require("promisepipe");

const promiseToWritableStream = require("./promise-to-writable-stream");

/**
 * Helper function to handle JSON extract sent to batch endpoint
 *
 * @name handleExtract
 * @public
 * @memberof Utils
 * @param {Object}   ctx Hull request context
 * @param {Object}   options
 * @param {Object}   options.body       request body object (req.body)
 * @param {Object}   options.batchSize  size of the chunk we want to pass to handler
 * @param {Function} options.callback    callback returning a Promise (will be called with array of elements)
 * @param {Function} options.onResponse callback called on successful inital response
 * @param {Function} options.onError    callback called during error
 * @return {Promise}
 */
function extractStream({
  url,
  format,
  batchSize,
  onData,
  onResponse,
  onError
}: {
  url: string,
  format: string,
  batchSize: number,
  onData: (Array<{}>) => Promise<any>,
  onResponse: void => void,
  onError: Error => void
}): Promise<*> {
  if (!url) return Promise.reject(new Error("Missing URL"));
  const decoder =
    format === "csv"
      ? CSVStream.createStream({ escapeChar: '"', enclosedChar: '"' })
      : JSONStream.parse();

  if (format === "csv") {
    // Workaround over problems on Node v8
    decoder._encoding = "utf8";
  }

  const batch = new BatchStream({ size: batchSize });

  const responseStream = requestClient({ url })
    .on("response", response => {
      if (_.isFunction(onResponse)) {
        onResponse(response);
      }
    })
    .on("error", error => {
      if (_.isFunction(onError)) {
        onError(error);
      }
    });
  return promisePipe(
    responseStream,
    decoder,
    batch,
    promiseToWritableStream(onData)
  );
}

module.exports = extractStream;
