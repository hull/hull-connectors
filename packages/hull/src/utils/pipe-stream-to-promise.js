// @flow
import type { Readable } from "stream";

const promiseToWritableStream = require("./promise-to-writable-stream");

function pipeStreamToPromise(
  readableStream: Readable,
  callback: (chunk: any, encoding?: string) => Promise<*>
): Promise<*> {
  const writableStream = promiseToWritableStream(callback);
  return new Promise((resolve, reject) => {
    const handleError = error => {
      reject(error);
    };
    const handleFinish = () => {
      resolve();
    };
    readableStream
      .on("error", handleError)
      .pipe(writableStream)
      .on("error", handleError)
      .on("finish", handleFinish);
  });
}

module.exports = pipeStreamToPromise;
