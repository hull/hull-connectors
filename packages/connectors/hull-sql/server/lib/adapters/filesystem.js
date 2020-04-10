/**
 * Module dependencies.
 */
import Promise from "bluebird";
import fs from "fs";
import JSONStream from "JSONStream";
import Stream from "stream";
import through2 from "through2";
import validateResultColumns from "./validate-result-columns";
const postgresAdapter = require("./postgres");

/**
 * File system adapter.
 */

/**
 * Open a new connection.
 *
 * Params:
 *   @connection_string String*
 *
 * Return:
 *   @client Instance
 */

export function openConnection() {}

/**
 * Close the connection.
 *
 * Params:
 *   @client Instance
 */

export function closeConnection() {}

/**
 * Wrap the user query
 * inside a PostgreSQL request.
 *
 * Params:
 *   @query String*
 *   @last_updated_at String
 *
 * Return:
 *   @wrappedQuery String
 */

export function wrapQuery(query) {
  return query;
}

/**
 * Validate Result specific for filesystem adapter
 * @returns Array of errors
 */

export function validateResult(result, import_type = "users") {
  if (process.env.POSTGRES_DATABASE_TEST !== "true") {
    return validateResultColumns(result.columns.map(column => column.name), import_type);
  }
  return postgresAdapter.validateResult(result);
}

export function checkForError() {
  return false;
}

export function cancelQuery() {}

/**
 * Run a wrapped query.
 *
 * Params:
 *   @client Instance*
 *   @wrappedQuery String*
 *   @callback Function*
 *
 * Return:
 *   @callback Function
 *     - @error Object
 *     - @rows Array
 */

export function runQuery(client, query = {}) {
  return new Promise((resolve) => {
    const file = fs.readFileSync(query, { encoding: "utf8" });
    const result = JSON.parse(file);
    resolve(result);
  });
}

/**
 * Stream a wrapped query.
 *
 * Params:
 *   @client Instance*
 *   @wrappedQuery String*
 *   @callback Function*
 *
 * Return:
 *   @callback Function
 *     - @error Object
 *     - @stream Stream
 */

export function streamQuery(client, query) {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(query).pipe(JSONStream.parse());
    resolve(stream);
    return stream;
  });
}

export function upload(shipId, partNumber) {
  const stream = new Stream.PassThrough();
  const promise = new Promise((resolve, reject) => {
    const filename = `/tmp/sql-extracts-${new Date().getTime()}-${partNumber}.json`;
    const writeStream = fs.createWriteStream(filename);
    let size = 0;
    writeStream.on("close", (err) => {
      if (err) {
        return reject(err);
      }
      return resolve({ url: `http://fake.url/${filename}`, partNumber, size });
    });
    stream
      .pipe(through2((chunk, enc, callback) => {
        size += 1;
        callback(null, chunk);
      }))
      .pipe(writeStream);
  });
  return { promise, stream };
}
